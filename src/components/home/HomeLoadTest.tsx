import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  translate,
  getQueueStatus,
  translateDistributed,
  getTranslateStatus,
} from "@/services/translateService";

type Lang = "en" | "th" | "ru";

const percentile = (arr: number[], p: number) => {
  if (arr.length === 0) return 0;
  const idx = Math.floor(p * arr.length);
  return arr[Math.min(Math.max(idx, 0), arr.length - 1)] || 0;
};

const HomeLoadTest: React.FC = () => {
  const [concurrency, setConcurrency] = useState(20);
  const [total, setTotal] = useState(200);
  const [text, setText] = useState("Hello from load test!");
  const [source, setSource] = useState<Lang>("en");
  const [target, setTarget] = useState<Lang>("th");
  const [distributed, setDistributed] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "stopping">("idle");
  const [sent, setSent] = useState(0);
  const [ok, setOk] = useState(0);
  const [fail, setFail] = useState(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [samples, setSamples] = useState<string[]>([]);
  const stopRef = useRef(false);

  const startPoll = useCallback(() => {
    stopRef.current = false;
    const tick = async () => {
      if (stopRef.current) return;
      try {
        await getQueueStatus();
      } catch {}
      setTimeout(tick, 1000);
    };
    tick();
  }, []);

  const stopPoll = useCallback(() => {
    stopRef.current = true;
  }, []);

  const run = useCallback(async () => {
    setRunning(true);
    setStatus("running");
    setSent(0);
    setOk(0);
    setFail(0);
    setLatencies([]);
    setSamples([]);
    startPoll();

    let sentLocal = 0;
    const latLocal: number[] = [];
    const upLatency = (dt: number) =>
      setLatencies((s) => {
        const n = [...s, dt];
        n.sort((a, b) => a - b);
        return n;
      });

    async function fireOne() {
      const t0 = performance.now();
      try {
        if (!distributed) {
          const res = await translate(
            { q: text, source, target, format: "text" },
            { distributed: false }
          );
          const dt = performance.now() - t0;
          latLocal.push(dt);
          upLatency(dt);
          setOk((x) => x + 1);
          if (samples.length < 5) {
            setSamples((s) =>
              s.length < 5
                ? [...s, String(res.translatedText).slice(0, 120)]
                : s
            );
          }
        } else {
          // distributed: enqueue job then poll status until completed
          const queued = await translateDistributed({
            q: text,
            source,
            target,
            format: "text",
          });
          if (queued?.status !== "queued" || !queued?.job_id) {
            throw new Error("queue failed");
          }
          let done = false;
          while (!done && !stopRef.current) {
            await new Promise((r) => setTimeout(r, 1000));
            const st = await getTranslateStatus(queued.job_id);
            if (st?.status === "completed" || st?.status === "processing") {
              if (st?.result?.translatedText) {
                done = true;
                const dt = performance.now() - t0;
                latLocal.push(dt);
                upLatency(dt);
                setOk((x) => x + 1);
                if (samples.length < 5) {
                  setSamples((s) =>
                    s.length < 5
                      ? [...s, String(st.result.translatedText).slice(0, 120)]
                      : s
                  );
                }
              }
            } else if (st?.status === "not_found" || st?.status === "error") {
              throw new Error("job error");
            }
          }
        }
      } catch {
        setFail((x) => x + 1);
      }
    }

    async function worker() {
      while (true) {
        const i = sentLocal++;
        if (i >= total || stopRef.current) break;
        setSent(i + 1);
        await fireOne();
      }
    }

    const workers = Array.from({ length: Math.max(1, concurrency) }, worker);
    await Promise.all(workers);
    stopPoll();
    setRunning(false);
    setStatus("idle");
  }, [
    concurrency,
    total,
    text,
    source,
    target,
    distributed,
    startPoll,
    stopPoll,
    samples.length,
  ]);

  const stats = useMemo(() => {
    const arr = latencies;
    const sum = arr.reduce((s, x) => s + x, 0);
    return {
      p50: percentile(arr, 0.5),
      p95: percentile(arr, 0.95),
      avg: arr.length ? sum / arr.length : 0,
    };
  }, [latencies]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Load Test (Home2)</h2>

      <div className="bg-white border rounded-md p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block w-2 h-2 rounded-full ${status === "running" ? "bg-green-500" : status === "stopping" ? "bg-yellow-500" : "bg-gray-400"}`}
            ></span>
            <span>
              {" "}
              Status: <b>{status}</b>
            </span>
            <span className="ml-3 text-gray-500">
              Progress: {sent}/{total}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-32 text-sm">Concurrency</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-40"
              value={concurrency}
              min={1}
              max={200}
              onChange={(e) =>
                setConcurrency(
                  Math.max(1, Math.min(200, Number(e.target.value) || 1))
                )
              }
              disabled={running || status === "stopping"}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-32 text-sm">Total requests</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-40"
              value={total}
              min={1}
              max={5000}
              onChange={(e) =>
                setTotal(
                  Math.max(1, Math.min(5000, Number(e.target.value) || 1))
                )
              }
              disabled={running || status === "stopping"}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-32 text-sm">Distributed</label>
            <input
              type="checkbox"
              checked={distributed}
              onChange={(e) => setDistributed(e.target.checked)}
              disabled={running || status === "stopping"}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-32 text-sm">Source</label>
            <select
              className="border rounded px-2 py-1"
              value={source}
              onChange={(e) => setSource(e.target.value as Lang)}
              disabled={running || status === "stopping"}
            >
              <option value="en">English</option>
              <option value="th">Thai</option>
              <option value="ru">Russian</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-32 text-sm">Target</label>
            <select
              className="border rounded px-2 py-1"
              value={target}
              onChange={(e) => setTarget(e.target.value as Lang)}
              disabled={running || status === "stopping"}
            >
              <option value="en">English</option>
              <option value="th">Thai</option>
              <option value="ru">Russian</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-sm">Text</label>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={running || status === "stopping"}
          />
          <div className="flex gap-3 items-center">
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              disabled={running || status === "stopping"}
              onClick={run}
            >
              {status === "running" ? "Running..." : "Start"}
            </button>
            <button
              className="px-4 py-2 rounded bg-gray-200"
              onClick={() => {
                if (running) setStatus("stopping");
                stopRef.current = true;
              }}
              disabled={!running}
            >
              {status === "stopping" ? "Stopping..." : "Stop"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-md p-4 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm">
            Sent: <b>{sent}</b>
          </div>
          <div className="text-sm text-green-700">
            Succeeded: <b>{ok}</b>
          </div>
          <div className="text-sm text-red-600">
            Failed: <b>{fail}</b>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm">p50: {stats.p50.toFixed(0)} ms</div>
          <div className="text-sm">p95: {stats.p95.toFixed(0)} ms</div>
          <div className="text-sm">avg: {stats.avg.toFixed(0)} ms</div>
        </div>
      </div>

      <div className="bg-white border rounded-md p-4">
        <div className="text-sm font-medium mb-2">Samples</div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {samples.map((s, i) => (
            <li key={i} className="text-gray-700">
              {s}
            </li>
          ))}
          {samples.length === 0 && <li className="text-gray-400">(empty)</li>}
        </ul>
      </div>
    </div>
  );
};

export default HomeLoadTest;
