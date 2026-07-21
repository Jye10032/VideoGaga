"""
Comic API 单元测试

测试漫剧项目的完整工作流程：
1. 创建项目
2. 设置配置
3. 生成剧本和场景
4. 轮询查询状态

使用方法:
    pytest tests/test_comic_api.py -v
    pytest tests/test_comic_api.py -v -s  # 显示 print 输出
"""

import asyncio
import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.core.database import init_db, create_tables
from app.core.security import create_access_token
from app.models.user import User


# pytest-asyncio 配置
pytest_plugins = ('pytest_asyncio',)


async def get_or_create_test_user(email: str, username: str) -> User:
    """获取或创建测试用户"""
    from app.core.database import AsyncSessionLocal as SessionLocal

    async with SessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                username=username,
                password_hash="test_hash",
                is_active=True,
                role="user"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        return user


@pytest.mark.asyncio
async def test_full_workflow():
    """
    完整工作流程测试

    测试步骤：
    1. 创建项目
    2. 设置配置
    3. 生成剧本
    4. 轮询状态直到完成
    5. 验证项目列表
    """
    # 初始化数据库
    init_db()
    await create_tables()

    # 创建测试用户
    user = await get_or_create_test_user(
        email="test_workflow@example.com",
        username="test_workflow_user"
    )

    # 创建 token 和 headers
    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 创建测试客户端
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # 步骤1: 创建项目
        print("\n=== 步骤1: 创建项目 ===")
        response = await client.post(
            "/api/v1/comic/projects",
            headers=headers,
            json={
                "title": "完整流程测试项目",
                "description": "测试完整的漫剧生成流程"
            }
        )
        assert response.status_code == 200, f"创建项目失败: {response.text}"
        project_id = response.json()["project_id"]
        print(f"项目创建成功: {project_id}")

        # 步骤2: 设置配置
        print("\n=== 步骤2: 设置配置 ===")
        response = await client.put(
            f"/api/v1/comic/projects/{project_id}/config",
            headers=headers,
            json={
                "config": {
                    "aspect_ratio": "16:9",
                    "creation_mode": "auto",
                    "script_mode": "dialogue",
                    "style": "anime"
                }
            }
        )
        assert response.status_code == 200, f"设置配置失败: {response.text}"
        print("配置设置成功")

        # 步骤3: 生成剧本
        print("\n=== 步骤3: 生成剧本 ===")
        response = await client.post(
            f"/api/v1/comic/projects/{project_id}/generate",
            headers=headers,
            json={
                "original_content": """
第一幕：咖啡厅

（阳光透过玻璃窗洒进来，小明推门走进咖啡厅）

小明：老板，来一杯美式咖啡，谢谢。

老板：好的，请稍等。今天天气真不错啊。

小明：是啊，适合出来走走。

（小明找了个靠窗的位置坐下，掏出手机）
                """
            }
        )
        assert response.status_code == 200, f"生成剧本失败: {response.text}"
        task_id = response.json()["task_id"]
        print(f"剧本生成任务已启动: {task_id}")

        # 步骤4: 轮询状态
        print("\n=== 步骤4: 轮询状态 ===")
        for i in range(15):
            await asyncio.sleep(1)
            response = await client.get(
                f"/api/v1/comic/projects/{project_id}",
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            status = data["status"]
            print(f"轮询 #{i+1}: {status}")

            if status == "COMPLETED":
                print("\n=== 生成完成 ===")
                # 新架构：数据在 script 和 scenes 中
                script = data.get("script")
                scenes = data.get("scenes", [])

                if script:
                    print(f"处理后内容: {script.get('processed_content', '')[:100]}...")
                    print(f"对话数量: {len(script.get('dialogues') or [])}")
                    print(f"角色数量: {len(script.get('extracted_characters') or [])}")
                    print(f"道具数量: {len(script.get('extracted_props') or [])}")

                print(f"场景数量: {len(scenes)}")

                # 验证数据完整性
                assert script, "script 不应为空"
                assert script.get('processed_content'), "processed_content 不应为空"
                assert len(script.get('dialogues') or []) > 0, "dialogues 不应为空"
                assert len(scenes) > 0, "scenes 不应为空"
                break
            elif status == "FAILED":
                pytest.fail(f"生成失败: {data.get('error_message')}")
        else:
            pytest.fail("轮询超时")

        # 步骤5: 验证项目列表
        print("\n=== 步骤5: 验证项目列表 ===")
        response = await client.get("/api/v1/comic/projects", headers=headers)
        assert response.status_code == 200
        list_data = response.json()
        print(f"项目列表获取成功，共 {list_data['total']} 个项目")

        # 确认新创建的项目在列表中
        project_ids = [item['id'] for item in list_data['items']]
        assert project_id in project_ids, "新创建的项目应该在列表中"

    print("\n=== 完整流程测试通过 ===")


@pytest.mark.asyncio
async def test_step_order_validation():
    """测试步骤顺序验证 - 跳过配置直接生成应该失败"""
    init_db()
    await create_tables()

    user = await get_or_create_test_user(
        email="test_step_order@example.com",
        username="test_step_order_user"
    )

    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 创建项目
        response = await client.post(
            "/api/v1/comic/projects",
            headers=headers,
            json={"title": "测试步骤顺序"}
        )
        assert response.status_code == 200
        project_id = response.json()["project_id"]

        # 尝试跳过配置直接生成（应该失败）
        response = await client.post(
            f"/api/v1/comic/projects/{project_id}/generate",
            headers=headers,
            json={"original_content": "test"}
        )

        assert response.status_code == 400, "跳过配置步骤应该返回 400"
        print(f"\n正确拒绝了跳步操作: {response.json()}")


@pytest.mark.asyncio
async def test_project_not_found():
    """测试访问不存在的项目"""
    init_db()
    await create_tables()

    user = await get_or_create_test_user(
        email="test_not_found@example.com",
        username="test_not_found_user"
    )

    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        fake_id = str(uuid.uuid4())
        response = await client.get(
            f"/api/v1/comic/projects/{fake_id}",
            headers=headers
        )

        assert response.status_code == 404, "应该返回 404"
        print(f"\n正确返回了 404: {response.json()}")


@pytest.mark.asyncio
async def test_unauthorized_access():
    """测试未授权访问"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/comic/projects")

        assert response.status_code == 401, "应该返回 401"
        print(f"\n正确拒绝了未授权访问")


@pytest.mark.asyncio
async def test_create_project_validation():
    """测试创建项目参数验证"""
    init_db()
    await create_tables()

    user = await get_or_create_test_user(
        email="test_validation@example.com",
        username="test_validation_user"
    )

    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 测试空标题
        response = await client.post(
            "/api/v1/comic/projects",
            headers=headers,
            json={"title": ""}  # 空标题应该失败
        )

        assert response.status_code == 422, "空标题应该返回 422 验证错误"
        print(f"\n正确拒绝了空标题: {response.json()}")
