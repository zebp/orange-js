import { createPrompt, usePrefix, useEffect } from "@inquirer/core";
import { Prompt } from "@inquirer/type";
import { spawn } from "child_process";

export const command: Prompt<
  void,
  { message: string; bin: string; args: string[]; cwd?: string }
> = createPrompt((config, done: (value: void) => void) => {
  const prefix = usePrefix({ status: "loading" });

  useEffect(() => {
    const child = spawn(config.bin, config.args, { cwd: config.cwd });

    child.on("close", (code) => {
      if (code === 0) {
        done(undefined);
      } else {
        done();
      }
    });
  }, [config.bin, config.args]);

  return `${prefix} ${config.message}`;
});
