import fixWebmDuration from "fix-webm-duration";
import { apiBase, getToken } from "../api/client";
import { Shot, StudioData } from "./types";

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  maxLines = 4,
) {
  let line = "",
    row = 0;
  for (const char of text) {
    if (ctx.measureText(line + char).width > width) {
      ctx.fillText(line, x, y + row * lineHeight);
      line = char;
      if (++row >= maxLines) return;
    } else line += char;
  }
  ctx.fillText(line, x, y + row * lineHeight);
}

export function demoImage(title: string, description: string, index = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext("2d")!;
  const palette = [
    ["#132a48", "#3b6373"],
    ["#372855", "#8b5476"],
    ["#23473d", "#618867"],
  ][index % 3];
  const gradient = ctx.createLinearGradient(0, 0, 960, 540);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(1, palette[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = "#ffffff16";
  ctx.beginPath();
  ctx.arc(760, 160, 85, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 8; i++)
    ctx.fillRect(i * 135, 310 - (i % 3) * 35, 95, 230);
  ctx.fillStyle = "#a6e9da";
  ctx.font = "18px sans-serif";
  ctx.fillText("VIDEOGAGA  /  本地演示 · 非 AI 画面", 56, 58);
  ctx.fillStyle = "white";
  ctx.font = "bold 40px sans-serif";
  wrap(ctx, title, 56, 220, 810, 50, 2);
  ctx.font = "22px sans-serif";
  ctx.fillStyle = "#e2edf0";
  wrap(ctx, description, 56, 340, 820, 34, 3);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function demoAudio(seconds: number) {
  const rate = 8000,
    length = Math.round(rate * seconds),
    buffer = new ArrayBuffer(44 + length * 2),
    view = new DataView(buffer);
  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++)
      view.setUint8(offset + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const volume = t < 0.25 ? 0.16 * Math.sin((Math.PI * t) / 0.25) : 0;
    view.setInt16(
      44 + i * 2,
      Math.sin(2 * Math.PI * 440 * t) * volume * 32767,
      true,
    );
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return "data:audio/wav;base64," + btoa(binary);
}

export async function mediaBlob(
  source: string,
  connected: boolean,
  signal?: AbortSignal,
): Promise<Blob> {
  if (source.startsWith("data:")) {
    if (
      !/^data:(image\/(png|jpeg|webp)|audio\/(wav|mpeg|mp3));base64,/.test(
        source,
      )
    )
      throw new Error("不支持的媒体格式");
    return (await fetch(source, { signal })).blob();
  }
  if (!source.startsWith("https://")) throw new Error("媒体地址不受支持");
  if (connected) {
    const response = await fetch(`${apiBase()}/api/v1/studio/media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ url: source }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(180000)])
        : AbortSignal.timeout(180000),
    });
    if (!response.ok) throw new Error("媒体下载失败，请检查结果地址是否过期");
    return response.blob();
  }
  const response = await fetch(source, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
      : AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error("媒体下载失败");
  return response.blob();
}

export async function imageUpload(file: File) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 8_000_000)
    throw new Error("请选择 8 MB 以内的 PNG、JPEG 或 WebP 图片");
  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > 40_000_000) {
    bitmap.close();
    throw new Error("图片尺寸过大");
  }
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function subtitles(shots: Shot[]) {
  const stamp = (seconds: number) =>
    new Date(seconds * 1000).toISOString().slice(11, 23).replace(".", ",");
  let time = 0,
    index = 0;
  return shots
    .flatMap((shot) => {
      const start = time;
      time += shot.duration;
      return shot.dialogue.trim()
        ? [`${++index}\n${stamp(start)} --> ${stamp(time)}\n${shot.dialogue}\n`]
        : [];
    })
    .join("\n");
}

/** Render current edits, not a bundled sample. Output is an actual playable recording. */
export async function renderMovie(
  data: StudioData,
  demo: boolean,
  onProgress: (n: number) => void,
  signal: AbortSignal,
) {
  if (!window.MediaRecorder)
    throw new Error("此浏览器不支持视频导出，请使用最新版 Chrome 或 Edge");
  if (
    !data.shots.length ||
    data.shots.some(
      (s) => !s.video || (!s.muted && s.dialogue.trim() && !s.audio),
    )
  )
    throw new Error("请先完成所有镜头的视频与配音，或将无需配音的镜头设为静音");
  const format = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ].find((t) => MediaRecorder.isTypeSupported(t));
  if (!format) throw new Error("此浏览器没有可用的视频编码器");
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] =
    data.ratio === "9:16"
      ? [540, 960]
      : data.ratio === "1:1"
        ? [720, 720]
        : [960, 540];
  const ctx = canvas.getContext("2d")!,
    audioContext = new AudioContext(),
    destination = audioContext.createMediaStreamDestination();
  await audioContext.resume();
  const stream = canvas.captureStream(24);
  destination.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  const urls: string[] = [],
    videos: HTMLVideoElement[] = [],
    buffers: (AudioBuffer | null)[] = [],
    visuals: (HTMLImageElement | HTMLVideoElement)[] = [];
  let recorder: MediaRecorder | undefined;
  try {
    for (const shot of data.shots) {
      signal.throwIfAborted();
      const source = shot.video === "demo:motion" ? shot.image : shot.video;
      if (!source) throw new Error("分镜缺少可用画面，请重新生成");
      const url = URL.createObjectURL(await mediaBlob(source, !demo, signal));
      urls.push(url);
      if (shot.video === "demo:motion") {
        const img = new Image();
        img.src = url;
        await img.decode();
        visuals.push(img);
      } else {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.src = url;
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("视频读取超时")),
            20000,
          );
          video.onloadeddata = () => {
            clearTimeout(timer);
            resolve();
          };
          video.onerror = () => {
            clearTimeout(timer);
            reject(new Error("无法解码视频"));
          };
        });
        videos.push(video);
        visuals.push(video);
      }
      buffers.push(
        shot.audio && !shot.muted
          ? await audioContext.decodeAudioData(
              await (await mediaBlob(shot.audio, !demo, signal)).arrayBuffer(),
            )
          : null,
      );
    }
    const chunks: BlobPart[] = [];
    recorder = new MediaRecorder(stream, {
      mimeType: format,
      videoBitsPerSecond: 3_000_000,
    });
    const finished = new Promise<Blob>((resolve, reject) => {
      recorder!.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder!.onstop = () => resolve(new Blob(chunks, { type: format }));
      recorder!.onerror = () => reject(new Error("视频编码失败"));
    });
    recorder.start(250);
    const total = data.shots.reduce((n, s) => n + s.duration, 0);
    let completed = 0;
    for (let i = 0; i < data.shots.length; i++) {
      const shot = data.shots[i],
        visual = visuals[i],
        buffer = buffers[i];
      if (visual instanceof HTMLVideoElement) {
        visual.currentTime = 0;
        await visual.play();
      }
      let source: AudioBufferSourceNode | undefined;
      if (buffer) {
        source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(destination);
        source.start();
      }
      const start = performance.now();
      await new Promise<void>((resolve, reject) => {
        const draw = () => {
          if (signal.aborted) {
            reject(new DOMException("已取消导出", "AbortError"));
            return;
          }
          const elapsed = (performance.now() - start) / 1000,
            t = Math.min(1, elapsed / shot.duration);
          ctx.fillStyle = "#080d14";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const w =
              visual instanceof HTMLVideoElement
                ? visual.videoWidth
                : visual.naturalWidth,
            h =
              visual instanceof HTMLVideoElement
                ? visual.videoHeight
                : visual.naturalHeight;
          const scale =
            Math.max(canvas.width / w, canvas.height / h) *
            (demo ? 1 + t * 0.035 : 1);
          ctx.drawImage(
            visual,
            (canvas.width - w * scale) / 2,
            (canvas.height - h * scale) / 2,
            w * scale,
            h * scale,
          );
          if (shot.dialogue.trim()) {
            ctx.fillStyle = "#000b";
            ctx.fillRect(0, canvas.height - 115, canvas.width, 115);
            ctx.fillStyle = "white";
            ctx.font = "24px sans-serif";
            wrap(
              ctx,
              shot.dialogue,
              32,
              canvas.height - 72,
              canvas.width - 64,
              32,
              2,
            );
          }
          if (demo) {
            ctx.fillStyle = "#0009";
            ctx.fillRect(16, 16, 210, 34);
            ctx.fillStyle = "white";
            ctx.font = "16px sans-serif";
            ctx.fillText("本地演示 · 非 AI 成片", 28, 39);
          }
          onProgress(
            Math.round(
              ((completed + Math.min(elapsed, shot.duration)) / total) * 100,
            ),
          );
          if (t >= 1) resolve();
          else requestAnimationFrame(draw);
        };
        draw();
      });
      source?.stop();
      if (visual instanceof HTMLVideoElement) visual.pause();
      completed += shot.duration;
    }
    recorder.stop();
    const rawBlob = await finished;
    const blob = format.includes("webm")
      ? await fixWebmDuration(rawBlob, total * 1000, { logger: false })
      : rawBlob;
    return { blob, extension: format.includes("mp4") ? "mp4" : "webm" };
  } finally {
    if (recorder?.state === "recording") recorder.stop();
    videos.forEach((v) => {
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
    stream.getTracks().forEach((t) => t.stop());
    await audioContext.close();
    urls.forEach((url) => URL.revokeObjectURL(url));
  }
}
