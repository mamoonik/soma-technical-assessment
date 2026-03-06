type TodoNode = {
    id: number;
    title: string;
    durationMinutes: number;
  };
  
  type Edge = { from: number; to: number }; // from todo -> dependency (todo depends on dependency)
  
//   export function detectCycle(nodes: TodoNode[], edges: Edge[]): boolean {
//     const adj = new Map<number, number[]>();
//     for (const n of nodes) adj.set(n.id, []);
//     for (const e of edges) adj.get(e.from)!.push(e.to);
  
//     const state = new Map<number, 0 | 1 | 2>(); // 0=unvisited,1=visiting,2=done
//     for (const n of nodes) state.set(n.id, 0);
  
//     const dfs = (u: number): boolean => {
//       state.set(u, 1);
//       for (const v of adj.get(u) || []) {
//         const s = state.get(v) || 0;
//         if (s === 1) return true;      // back-edge => cycle
//         if (s === 0 && dfs(v)) return true;
//       }
//       state.set(u, 2);
//       return false;
//     };
  
//     for (const n of nodes) {
//       if ((state.get(n.id) || 0) === 0) {
//         if (dfs(n.id)) return true;
//       }
//     }
//     return false;
//   }
  
  export function detectCycle(
    nodes: { id: number }[],
    edges: { from: number; to: number }[]
  ): boolean {
    const graph = new Map<number, number[]>();
    for (const n of nodes) graph.set(n.id, []);
    for (const e of edges) {
      if (!graph.has(e.from)) graph.set(e.from, []);
      graph.get(e.from)!.push(e.to);
    }
  
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<number, number>();
    for (const n of nodes) color.set(n.id, WHITE);
  
    const dfs = (u: number): boolean => {
      color.set(u, GRAY);
      for (const v of graph.get(u) ?? []) {
        const c = color.get(v) ?? WHITE;
        if (c === GRAY) return true;        // back-edge => cycle
        if (c === WHITE && dfs(v)) return true;
      }
      color.set(u, BLACK);
      return false;
    };
  
    for (const n of nodes) {
      if ((color.get(n.id) ?? WHITE) === WHITE) {
        if (dfs(n.id)) return true;
      }
    }
    return false;
  }

  export function topoSort(nodes: TodoNode[], edges: Edge[]): number[] {
    // Build adjacency from dependency -> dependent
    // If A depends on B, then B must come before A
    const adj = new Map<number, number[]>();
    const indeg = new Map<number, number>();
  
    for (const n of nodes) {
      adj.set(n.id, []);
      indeg.set(n.id, 0);
    }
  
    for (const e of edges) {
      // dependency e.to -> todo e.from
      adj.get(e.to)!.push(e.from);
      indeg.set(e.from, (indeg.get(e.from) || 0) + 1);
    }
  
    const q: number[] = [];
    for (const [id, d] of indeg.entries()) if (d === 0) q.push(id);
  
    const order: number[] = [];
    while (q.length) {
      const u = q.shift()!;
      order.push(u);
      for (const v of adj.get(u) || []) {
        indeg.set(v, (indeg.get(v) || 0) - 1);
        if ((indeg.get(v) || 0) === 0) q.push(v);
      }
    }
    return order;
  }
  
  export function computeSchedule(
    nodes: TodoNode[],
    edges: Edge[],
    projectStartMs: number
  ) {
    const byId = new Map(nodes.map(n => [n.id, n]));
    const order = topoSort(nodes, edges);
  
    // Map todo -> dependencies
    const deps = new Map<number, number[]>();
    for (const n of nodes) deps.set(n.id, []);
    for (const e of edges) deps.get(e.from)!.push(e.to);
  
    // Earliest times (in minutes from project start)
    const ES = new Map<number, number>(); // earliest start minutes
    const EF = new Map<number, number>(); // earliest finish minutes
  
    for (const id of order) {
      const depIds = deps.get(id) || [];
      const es = depIds.length === 0
        ? 0
        : Math.max(...depIds.map(d => EF.get(d) ?? 0));
      ES.set(id, es);
      EF.set(id, es + (byId.get(id)?.durationMinutes ?? 60));
    }
  
    const projectDuration = Math.max(...order.map(id => EF.get(id) ?? 0), 0);
  
    // Reverse adjacency (todo -> dependents) for latest times
    const dependents = new Map<number, number[]>();
    for (const n of nodes) dependents.set(n.id, []);
    for (const e of edges) {
      // dependency e.to has dependent e.from
      dependents.get(e.to)!.push(e.from);
    }
  
    // Latest times
    const LS = new Map<number, number>();
    const LF = new Map<number, number>();
  
    // Initialize LF to projectDuration for nodes with no dependents
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      const outs = dependents.get(id) || [];
      const lf = outs.length === 0
        ? projectDuration
        : Math.min(...outs.map(ch => LS.get(ch) ?? projectDuration));
      LF.set(id, lf);
      LS.set(id, lf - (byId.get(id)?.durationMinutes ?? 60));
    }
  
    // Slack and critical path nodes
    const slack = new Map<number, number>();
    const isCritical = new Map<number, boolean>();
    for (const id of order) {
      const s = (LS.get(id) ?? 0) - (ES.get(id) ?? 0);
      slack.set(id, s);
      isCritical.set(id, s === 0);
    }
  
    // Build a representative critical path by walking from a critical node with ES=0
    // following critical edges that preserve timing.
    const criticalPath: number[] = [];
    const startCandidates = order.filter(id => (ES.get(id) ?? 0) === 0 && isCritical.get(id));
    const start = startCandidates[0];
    if (start != null) {
      criticalPath.push(start);
      let cur = start;
      while (true) {
        const next = (dependents.get(cur) || []).find(nxt =>
          isCritical.get(nxt) &&
          (ES.get(nxt) ?? -1) === (EF.get(cur) ?? -2)
        );
        if (!next) break;
        criticalPath.push(next);
        cur = next;
      }
    }
  
    const result: Record<number, any> = {};
    for (const id of order) {
      result[id] = {
        earliestStart: new Date(projectStartMs + (ES.get(id) ?? 0) * 60_000).toISOString(),
        earliestFinish: new Date(projectStartMs + (EF.get(id) ?? 0) * 60_000).toISOString(),
        slackMinutes: slack.get(id) ?? 0,
        isCritical: isCritical.get(id) ?? false,
      };
    }
  
    return { scheduleById: result, criticalPath, projectDurationMinutes: projectDuration };
  }