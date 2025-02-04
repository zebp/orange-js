import { WorkflowEntrypoint } from "cloudflare:workers";
import { CloudflareEnv } from "./index.js";

// @ts-ignore
import { env } from "./internal.js";

export async function start<
  Wrkflow extends WorkflowEntrypoint<CloudflareEnv, Params>,
  Params extends {},
>(
  workflow: new (ctx: ExecutionContext, env: CloudflareEnv) => Wrkflow,
  id: string,
  params: Params,
): Promise<WorkflowInstance>;
export async function start<
  Wrkflow extends WorkflowEntrypoint<CloudflareEnv, Params>,
  Params extends {},
>(
  workflow: new (ctx: ExecutionContext, env: CloudflareEnv) => Wrkflow,
  params: Params,
): Promise<WorkflowInstance>;
export async function start<
  Wrkflow extends WorkflowEntrypoint<CloudflareEnv, Params>,
  Params extends {},
>(
  workflow: new (ctx: ExecutionContext, env: CloudflareEnv) => Wrkflow,
  idOrParams: string | Params,
  params?: Params,
): Promise<WorkflowInstance> {
  const workflowClassName = workflow.name;
  const e = env() as { [key: string]: Workflow<Params> };

  if (typeof idOrParams === "string") {
    return await e[workflowClassName].create({
      id: idOrParams,
      params,
    });
  } else {
    return await e[workflowClassName].create({
      params: idOrParams,
    });
  }
}

export async function get<
  Wrkflow extends WorkflowEntrypoint<CloudflareEnv, unknown>,
>(
  workflow: new (ctx: ExecutionContext, env: CloudflareEnv) => Wrkflow,
  id: string,
): Promise<WorkflowInstance> {
  const workflowClassName = workflow.name;
  const e = env() as { [key: string]: Workflow<unknown> };
  return await e[workflowClassName].get(id);
}
