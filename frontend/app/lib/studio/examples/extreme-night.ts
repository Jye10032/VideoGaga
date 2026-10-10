import { Asset, newShot, Shot, StudioData } from "../types";
import { imageUpload } from "../media";
import source from "./extreme-night.json";

export const ACCEPTANCE_SAMPLE_NAME = "极夜崩塌 · 示例项目";

// A shortened acceptance story adapted from the supplied case2, not model output.
// Stable designs live in assets; injuries, wardrobe and ownership changes live here.
const scenes = ["破败便利店", "黄昏车库", "废墟街道"];
type Beat = {
  scene: number;
  title: string;
  text: string;
  camera: string;
  action: string;
  refs: string[];
};
const beats: Beat[] = [
  {
    scene: 1,
    title: "陌生的清晨",
    text: "林栖在破败的便利店惊醒，数学试卷滑落脚边。",
    camera: "中近景 · 平视 · 缓慢推近",
    action:
      "林栖从收银台前的旧椅上直起身，一张试卷从脸颊滑落。蓝白校服完整，高马尾，鞋子落地。冷光从破损橱窗斜照进来。",
    refs: ["lin-qi"],
  },
  {
    scene: 1,
    title: "书中的世界",
    text: "她攥紧《极夜崩塌》，书页停在炮灰遇险的章节。",
    camera: "特写 · 俯视 · 固定镜头",
    action:
      "林栖双手握住卷边平装书，深蓝冰川封面露在打开的书页下。手指压住即将遇险的章节；她的校服袖口完整。",
    refs: ["lin-qi", "novel"],
  },
  {
    scene: 1,
    title: "门外异响",
    text: "玻璃门被撞响，她后退碰倒易拉罐。",
    camera: "全景 · 平视 · 轻微后移",
    action:
      "感染者在便利店玻璃门外撞击门框。林栖向收银台退去，鞋跟碰倒空罐，罐子滚向倾倒的货架。门、柜台与货架位置沿用场景设定。",
    refs: ["lin-qi", "infected", "novel"],
  },
  {
    scene: 1,
    title: "柜台藏身",
    text: "周燧把她拉进柜台下，示意她保持安静。",
    camera: "中近景 · 侧面 · 跟随下移",
    action:
      "周燧从收银台后伸手拉住林栖，二人蹲入柜台下方。周燧深灰战术夹克与黑色长裤完整，林栖把小说压在胸前；周燧竖指示意安静。",
    refs: ["lin-qi", "zhou-sui", "novel"],
  },
  {
    scene: 1,
    title: "裂缝的动静",
    text: "林栖低声提醒：柜台后面有东西。",
    camera: "特写 · 俯视 · 缓慢移向裂缝",
    action:
      "林栖伸出手指指向收银机下方的地板裂缝，紫黑色藤蔓尖端从缝里探出。周燧转头，二人仍在柜台下，门外只有模糊晃动的影子。",
    refs: ["lin-qi", "zhou-sui", "vine"],
  },
  {
    scene: 1,
    title: "藤蔓收紧",
    text: "藤蔓缠住周燧右脚，电弧只能让它短暂松开。",
    camera: "近景 · 低角度 · 固定镜头",
    action:
      "紫黑藤蔓从裂缝卷住周燧右脚踝。他撑住柜台边缘，指尖电弧击中藤蔓；藤蔓松开一瞬，又收紧。右腿裤管开始磨破，后续镜头持续保留此变化。",
    refs: ["zhou-sui", "vine"],
  },
  {
    scene: 1,
    title: "抓住酒精",
    text: "林栖抓起半瓶酒精，拧开瓶盖，泼向藤蔓根部。",
    camera: "中近景 · 侧面 · 跟随手部",
    action:
      "林栖先把小说塞进口袋，再从倒下的货架旁抓起酒精瓶，旋开白色瓶盖，将透明液体泼向地板裂缝中的藤蔓根部。她的校服袖口仍完整。",
    refs: ["lin-qi", "alcohol", "vine", "novel"],
  },
  {
    scene: 1,
    title: "点火信号",
    text: "林栖喊道：用火，它怕火！",
    camera: "近景 · 平视 · 固定镜头",
    action:
      "林栖放下空酒精瓶，朝周燧挥手指向湿润的藤蔓根部。周燧抬起手指，细蓝电弧亮起。橱窗冷光仍为主光源，地面尚未起火。",
    refs: ["lin-qi", "zhou-sui", "alcohol", "vine"],
  },
  {
    scene: 1,
    title: "冲出后门",
    text: "周燧引燃酒精，拉着林栖穿过后门冲进巷子。",
    camera: "远景 · 背面 · 跟随前移",
    action:
      "酒精着火，橙色火光映在固定的柜台和货架上。周燧拖着磨破的右裤腿拉住林栖，绕过货架冲出金属后门；林栖的小说仍在口袋里。",
    refs: ["lin-qi", "zhou-sui", "vine", "novel"],
  },
  {
    scene: 2,
    title: "黄昏避难",
    text: "黄昏时，两人躲进车库，周燧按住受伤的右腿。",
    camera: "全景 · 平视 · 缓慢推近",
    action:
      "切至黄昏，二人经过一段逃亡后进入车库。周燧靠关闭的卷帘门坐下，右脚踝裤管磨破；林栖靠在轮胎旁喘息。高处透气窗射入橘红光。",
    refs: ["lin-qi", "zhou-sui"],
  },
  {
    scene: 2,
    title: "追问来源",
    text: "周燧问：你怎么知道它怕火？",
    camera: "中近景 · 平视 · 固定镜头",
    action:
      "周燧仍坐在卷帘门旁，一只手压住受伤右腿，抬眼看向林栖。备用匕首仍在大腿侧刀鞘内，不拿出不转移。",
    refs: ["zhou-sui", "lin-qi", "dagger"],
  },
  {
    scene: 2,
    title: "举书回应",
    text: "林栖举起小说：我说我能预见未来，你信吗？",
    camera: "近景 · 平视 · 缓慢推近",
    action:
      "林栖从口袋取出深蓝色小说，举到胸前面对周燧。校服袖口此时仍完整，书封面保持同样的冰川裂纹与卷边。",
    refs: ["lin-qi", "novel", "zhou-sui"],
  },
  {
    scene: 2,
    title: "结局变白",
    text: "书页上的遇险结局渐渐消失，只留下一片空白。",
    camera: "大特写 · 垂直俯视 · 固定镜头",
    action:
      "林栖翻开小说，纸张上的一小段铅字逐渐变淡，最后消失。只改变这一页的字迹，书本封面、厚度、卷边和持有者都不改变。",
    refs: ["novel", "lin-qi"],
  },
  {
    scene: 2,
    title: "撕袖包扎",
    text: "林栖撕下校服袖口，替周燧包扎右腿。",
    camera: "中近景 · 俯视 · 固定镜头",
    action:
      "林栖把书收回口袋，撕下一截左袖袖口，蹲下用布条绕住周燧的右脚踝并打结。从此镜头起，林栖左袖口缺损、周燧右脚踝有蓝白布条包扎。",
    refs: ["lin-qi", "zhou-sui", "novel"],
  },
  {
    scene: 2,
    title: "交付匕首",
    text: "周燧递出备用匕首：拿着，接下来跟紧我。",
    camera: "特写 · 侧面 · 跟随交接",
    action:
      "周燧从大腿侧刀鞘取出备用匕首，将刀柄朝向林栖递出。林栖用右手接住；左袖口缺损，小说留在口袋。匕首归属在本镜头由周燧转为林栖。",
    refs: ["zhou-sui", "lin-qi", "dagger"],
  },
  {
    scene: 3,
    title: "离开车库",
    text: "两人走出车库，周燧右腿的布条仍紧紧缠着。",
    camera: "全景 · 背面 · 缓慢跟随",
    action:
      "入夜前，二人从车库走入废墟街道。周燧右脚踝保留蓝白布条，步伐略慢。林栖左袖口缺损、右手持匕首；远处残火映出橘色亮边。",
    refs: ["lin-qi", "zhou-sui", "dagger"],
  },
  {
    scene: 3,
    title: "握紧新的选择",
    text: "林栖按住口袋里的书，右手握紧周燧给她的匕首。",
    camera: "近景 · 侧面 · 固定镜头",
    action:
      "林栖用左手按住校服口袋中的小说，缺损袖口清晰可见。右手握紧黑色刀柄，刀尖朝下。周燧在她前方，右脚踝包扎保持不变。",
    refs: ["lin-qi", "novel", "dagger", "zhou-sui"],
  },
  {
    scene: 3,
    title: "走向下一章",
    text: "她跟上周燧，身影渐渐消失在火光映照的街道。",
    camera: "大远景 · 背面 · 缓慢拉远",
    action:
      "林栖跟上周燧，两人沿同一条废墟街道向远处走去。书由林栖放在口袋，匕首在林栖右手，周燧右腿包扎、林栖左袖破损持续保留。",
    refs: ["lin-qi", "zhou-sui", "novel", "dagger"],
  },
];

function fit(
  ctx: CanvasRenderingContext2D,
  image: ImageBitmap,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.min(w / image.width, h / image.height);
  const width = image.width * scale,
    height = image.height * scale;
  ctx.drawImage(
    image,
    x + (w - width) / 2,
    y + (h - height) / 2,
    width,
    height,
  );
}

function referenceBoard(
  shot: Shot,
  assets: Asset[],
  images: Map<string, ImageBitmap>,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#14111f";
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = "#b7a6ef";
  ctx.font = "18px sans-serif";
  ctx.fillText("VIDEOGAGA  /  参考资产拼板 · 非 AI 分镜", 28, 34);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText(shot.title, 28, 74);
  const scene = assets.find((a) => a.kind === "scene");
  if (scene && images.has(scene.id))
    fit(ctx, images.get(scene.id)!, 28, 104, 810, 452);
  assets
    .filter((a) => a.kind !== "scene")
    .slice(0, 3)
    .forEach((asset, index) => {
      const y = 108 + index * 152;
      ctx.fillStyle = "#24202f";
      ctx.fillRect(866, y, 386, 140);
      const bitmap = images.get(asset.id);
      if (bitmap) fit(ctx, bitmap, 874, y + 25, 370, 108);
      ctx.fillStyle = "#ded6f2";
      ctx.font = "16px sans-serif";
      ctx.fillText(
        `${asset.name}${bitmap ? "" : " · 待补参考图"}`,
        878,
        y + 20,
      );
    });
  ctx.fillStyle = "#e2dced";
  ctx.font = "22px sans-serif";
  ctx.fillText(shot.camera, 28, 602);
  ctx.font = "20px sans-serif";
  let line = "",
    row = 0;
  for (const char of shot.description) {
    if (ctx.measureText(line + char).width > 1210) {
      ctx.fillText(line, 28, 640 + row * 28);
      line = char;
      row++;
      if (row >= 2) break;
    } else line += char;
  }
  if (row < 2) ctx.fillText(line, 28, 640 + row * 28);
  return canvas.toDataURL("image/jpeg", 0.88);
}

export async function acceptanceSampleData(
  onProgress: (message: string) => void,
): Promise<StudioData> {
  const assets: Asset[] = [];
  const images = new Map<string, ImageBitmap>();
  const ids = new Map(
    source.assets.map((asset) => [asset.id, crypto.randomUUID()]),
  );
  try {
    for (const [index, asset] of source.assets.entries()) {
      onProgress(`载入资产 ${index + 1}/${source.assets.length}`);
      let image = "";
      if (asset.image) {
        const response = await fetch(asset.image, {
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`无法读取参考图：${asset.name}`);
        const blob = await response.blob();
        image = await imageUpload(
          new File([blob], `${asset.id}.webp`, { type: "image/webp" }),
        );
        images.set(ids.get(asset.id)!, await createImageBitmap(blob));
      }
      assets.push({
        ...asset,
        id: ids.get(asset.id)!,
        kind: asset.kind as Asset["kind"],
        image,
        confirmed: false,
      });
    }
    const sceneKeys = ["convenience-store", "garage", "ruined-street"];
    const indexes = [0, 0, 0];
    const shots = beats.map((beat) => {
      const number = ++indexes[beat.scene - 1];
      const shot: Shot = {
        ...newShot(),
        title: `${beat.scene}-${number} · ${scenes[beat.scene - 1]} · ${beat.title}`,
        description: beat.action,
        dialogue: beat.text,
        camera: beat.camera,
        duration: Math.max(
          3,
          Math.ceil((beat.text.match(/\p{Script=Han}/gu) || []).length / 6),
        ),
        assetIds: [sceneKeys[beat.scene - 1], ...beat.refs].map((id) =>
          ids.get(id)!,
        ),
      };
      const refs = shot.assetIds.map((id) =>
        assets.find((asset) => asset.id === id)!,
      );
      shot.image = referenceBoard(shot, refs, images);
      return shot;
    });
    onProgress("保存验收示例…");
    return {
      ratio: "16:9",
      script: scenes
        .map(
          (name, i) =>
            `【场次 ${i + 1} · ${name}】\n${beats
              .filter((b) => b.scene === i + 1)
              .map((b) => b.text)
              .join("\n")}`,
        )
        .join("\n\n"),
      assets,
      shots,
    };
  } finally {
    images.forEach((image) => image.close());
  }
}
