import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchPexelsImageUrl } from '@/lib/pexels';
// import { computeSchedule } from "@/lib/scheduler";
import { computeSchedule, detectCycle } from "@/lib/scheduler";
// export async function GET() {
//   try {
//     // const todos = await prisma.todo.findMany({
//     //   orderBy: {
//     //     createdAt: 'desc',
//     //   },
//     // });
//     const todos = await prisma.todo.findMany({
//       orderBy: { createdAt: "desc" },
//       include: {
//         dependencies: {
//           include: { dependsOn: true }, // gives us the dependency todo data
//         },
//       },
//     });
//     return NextResponse.json(todos);
//   } catch (error) {
//     return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
//   }
// }

// export async function GET() {
//   try {
//     const todos = await prisma.todo.findMany({
//       orderBy: { createdAt: "desc" },
//       include: { dependencies: true },
//     });

//     const nodes = todos.map(t => ({
//       id: t.id,
//       title: t.title,
//       durationMinutes: t.durationMinutes ?? 60,
//     }));

//     const edges = todos.flatMap(t =>
//       t.dependencies.map(d => ({ from: d.todoId, to: d.dependsOnId }))
//     );

//     const projectStartMs = Date.now();
//     const schedule = computeSchedule(nodes, edges, projectStartMs);

//     return NextResponse.json({
//       todos,
//       edges,
//       schedule,
//     });
//   } catch (error) {
//     return NextResponse.json({ error: "Error fetching todos" }, { status: 500 });
//   }
// }

// export async function GET() {
//   try {
//     const todos = await prisma.todo.findMany({
//       orderBy: { createdAt: "desc" },
//       include: {
//         dependencies: true,     // <-- assumes you added relation field
//         dependents: true,       // <-- assumes you added relation field
//       },
//     });

//     // Edges for graph: todoId dependsOnId
//     const edges = todos.flatMap((t) =>
//       (t.dependencies ?? []).map((d: any) => ({
//         from: d.todoId,
//         to: d.dependsOnId,
//       }))
//     );

//     // If you already implemented a schedule builder, call it here.
//     // For now, return empty schedule so UI doesn't break.
//     const schedule = {
//       criticalPath: [],
//       scheduleById: {},
//     };

//     return NextResponse.json({ todos, edges, schedule });
//   } catch (error) {
//     console.error("GET /api/todos error:", error);
//     return NextResponse.json({ error: "Error fetching todos" }, { status: 500 });
//   }
// }


export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        dependencies: true,
        dependents: true,
      },
    });

    const nodes = todos.map((t) => ({
      id: t.id,
      title: t.title,
      durationMinutes: t.durationMinutes ?? 60,
    }));

    const edges = todos.flatMap((t) =>
      (t.dependencies ?? []).map((d: any) => ({
        from: d.todoId,
        to: d.dependsOnId,
      }))
    );

    const projectStartMs = Date.now();

    const schedule = computeSchedule(nodes, edges, projectStartMs);

    return NextResponse.json({
      todos,
      edges,
      schedule,
    });

  } catch (error) {
    console.error("GET /api/todos error:", error);
    return NextResponse.json({ error: "Error fetching todos" }, { status: 500 });
  }
}
// export async function POST(request: Request) {
//   try {
//     const { title, dueDate } = await request.json();

//     if (!title || title.trim() === '') {
//       return NextResponse.json({ error: 'Title is required' }, { status: 400 });
//     }

//     const todo = await prisma.todo.create({
//       data: {
//         title: title.trim(),
//         dueDate: dueDate ? new Date(dueDate) : null, // <-- added this dueDate field
//       },
//     });

//     const imageUrl = await fetchPexelsImageUrl(title.trim());
//     const updatedTodo = await prisma.todo.update({
//       where: { id: todo.id },
//       data: { imageUrl },
//     });

//     return NextResponse.json(updatedTodo, { status: 201 });
//     // return NextResponse.json(todo, { status: 201 });
    
//   } catch (error) {
//     console.error("POST /api/todos error:", error); // <-- added this
//     return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   try {
//     // const { title, dueDate } = await request.json(); // Updated the POST /api/todos to accept dependencyIdsb
//     const { title, dueDate, dependencyIds, durationMinutes } = await request.json();

//     if (!title || title.trim() === '') {
//       return NextResponse.json({ error: 'Title is required' }, { status: 400 });
//     }

//     const todo = await prisma.todo.create({
//       data: {
//         title: title.trim(),
//         dueDate: dueDate ? new Date(dueDate) : null,
//         imageUrl: null, // added this for part 2
//         durationMinutes: Number(durationMinutes) > 0 ? Number(durationMinutes) : 60, // added this for pat 3

//       },
//     });

//     const imageUrl = await fetchPexelsImageUrl(title.trim());

//     const updatedTodo = await prisma.todo.update({
//       where: { id: todo.id },
//       data: { imageUrl },
//     });

//     return NextResponse.json(updatedTodo, { status: 201 });
//   } catch (error) {
//     console.error("POST /api/todos error:", error);
//     return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const { title, dueDate, dependencyIds, durationMinutes } = await request.json();

//     if (!title || title.trim() === "") {
//       return NextResponse.json({ error: "Title is required" }, { status: 400 });
//     }

//     // 1️⃣ Create the todo first
//     const todo = await prisma.todo.create({
//       data: {
//         title: title.trim(),
//         dueDate: dueDate ? new Date(dueDate) : null,
//         imageUrl: null,
//         durationMinutes: Number(durationMinutes) > 0 ? Number(durationMinutes) : 60,
//       },
//     });

//     // 2️⃣ Fetch existing graph for cycle detection
//     const existing = await prisma.todo.findMany({
//       include: { dependencies: true },
//     });

//     const nodes = existing.map(t => ({
//       id: t.id,
//       title: t.title,
//       durationMinutes: t.durationMinutes ?? 60,
//     }));

//     const edges = existing.flatMap(t =>
//       t.dependencies.map(d => ({
//         from: d.todoId,
//         to: d.dependsOnId,
//       }))
//     );

//     const proposedEdges = [
//       ...edges,
//       ...(dependencyIds || []).map((depId: number) => ({
//         from: todo.id,
//         to: depId,
//       })),
//     ];

//     // 3️⃣ Prevent self dependency
//     if ((dependencyIds || []).includes(todo.id)) {
//       return NextResponse.json(
//         { error: "Todo cannot depend on itself" },
//         { status: 400 }
//       );
//     }

//     // 4️⃣ Prevent circular dependencies
//     if (detectCycle(nodes, proposedEdges)) {
//       return NextResponse.json(
//         { error: "Circular dependency detected" },
//         { status: 400 }
//       );
//     }

//     // ⭐⭐⭐ THIS IS WHERE YOUR CODE GOES ⭐⭐⭐
//     if (Array.isArray(dependencyIds) && dependencyIds.length > 0) {
//       await prisma.todoDependency.createMany({
//         data: dependencyIds.map((depId: number) => ({
//           todoId: todo.id,
//           dependsOnId: depId,
//         })),
//         skipDuplicates: true,
//       });
//     }

//     // 5️⃣ Fetch image (Part 2 feature)
//     const imageUrl = await fetchPexelsImageUrl(title.trim());

//     const updatedTodo = await prisma.todo.update({
//       where: { id: todo.id },
//       data: { imageUrl },
//     });

//     // 6️⃣ Return result
//     return NextResponse.json(updatedTodo, { status: 201 });

//   } catch (error) {
//     console.error("POST /api/todos error:", error);
//     return NextResponse.json({ error: "Error creating todo" }, { status: 500 });
//   }
// }


export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      dueDate,
      dependencyIds,
      durationMinutes,
    }: {
      title?: string;
      dueDate?: string | null;
      dependencyIds?: number[];
      durationMinutes?: number;
    } = body;

    console.log("POST /api/todos: received", {
      title,
      dueDate,
      dependencyIds,
      durationMinutes,
    });

    if (!title || title.trim() === "") {
      console.log("POST /api/todos: missing title");
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    console.log("POST /api/todos: creating todo...");

    const todo = await prisma.todo.create({
      data: {
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        imageUrl: null,
        durationMinutes: Number(durationMinutes) > 0 ? Number(durationMinutes) : 60,
      },
    });

    console.log("POST /api/todos: created todo", { id: todo.id });

    // ===== Existing graph fetch (for cycle checks) =====
    console.log("POST /api/todos: fetching existing graph...");
    const existing = await prisma.todo.findMany({
      include: { dependencies: true },
    });

    console.log("POST /api/todos: existing todos count", existing.length);

    const nodes = existing.map((t) => ({
      id: t.id,
      title: t.title,
      durationMinutes: (t as any).durationMinutes ?? 60,
    }));

    const edges = existing.flatMap((t) =>
      (t as any).dependencies.map((d: any) => ({
        from: d.todoId,
        to: d.dependsOnId,
      }))
    );

    console.log("POST /api/todos: existing edges count", edges.length);

    const proposedEdges = [
      ...edges,
      ...((dependencyIds ?? []).map((depId: number) => ({
        from: todo.id,
        to: depId,
      }))),
    ];

    console.log("POST /api/todos: proposedEdges count", proposedEdges.length);

    // 1) Prevent self dependency
    if ((dependencyIds ?? []).includes(todo.id)) {
      console.log("POST /api/todos: self-dependency detected, todoId:", todo.id);
      return NextResponse.json(
        { error: "Todo cannot depend on itself" },
        { status: 400 }
      );
    }

    // 2) Prevent circular dependencies
    console.log("POST /api/todos: running cycle detection...");
    const hasCycle = detectCycle(nodes, proposedEdges);
    console.log("POST /api/todos: cycle detection result:", hasCycle);

    if (hasCycle) {
      console.log("POST /api/todos: circular dependency detected");
      return NextResponse.json(
        { error: "Circular dependency detected" },
        { status: 400 }
      );
    }

    // 3) Save dependencies
    console.log("POST /api/todos: saving dependencies...");
    if (Array.isArray(dependencyIds) && dependencyIds.length > 0) {
      // await prisma.todoDependency.createMany({
      //   data: dependencyIds.map((depId: number) => ({
      //     todoId: todo.id,
      //     dependsOnId: depId,
      //   })),
      //   skipDuplicates: true,
      // });
      for (const dependsOnId of dependencyIds) {
        await prisma.todoDependency.create({
          data: {
            todoId: todo.id,
            dependsOnId,
          },
        })
      }
      console.log("POST /api/todos: dependencies saved", dependencyIds);
    } else {
      console.log("POST /api/todos: no dependencies to save");
    }

    // 4) Fetch + save image
    console.log("POST /api/todos: about to fetch pexels...");
    const imageUrl = await fetchPexelsImageUrl(title.trim());
    console.log("POST /api/todos: pexels imageUrl =", imageUrl);

    console.log("POST /api/todos: updating todo with imageUrl...");
    const updatedTodo = await prisma.todo.update({
      where: { id: todo.id },
      data: { imageUrl },
    });

    console.log("POST /api/todos: updated todo", { id: updatedTodo.id });

    return NextResponse.json(updatedTodo, { status: 201 });
  } catch (error) {
    console.error("POST /api/todos error:", error);
    return NextResponse.json({ error: "Error creating todo" }, { status: 500 });
  }
}