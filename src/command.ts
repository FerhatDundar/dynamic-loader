// chain.ts
import { exec, ExecOptions, ChildProcess } from 'child_process';
import { PassThrough, Readable } from 'stream';
import { EventEmitter } from 'events';

export interface StepCloseData {
  cmd: string;
  code: number | null;                 // exit code or null if killed by signal
  signal: NodeJS.Signals | null;
}

export interface ChainProcess extends EventEmitter {
  stdout: Readable;                    // merged stdout
  stderr: Readable;                    // merged stderr
  /**
   * Forwarded to the *currently active* child; returns false if no child yet.
   */
  kill(signal?: NodeJS.Signals): boolean;
}

export type CommandDetail = {
    cmd: string,
    ignoreStdout?: boolean,
    ignoreStdErr?: boolean
}

/**
 * Run shell commands sequentially and expose a single “process-like” handle.
 *
 * @param commands  Commands to execute in order (each via `exec()`).
 * @param opts      Normal `exec()` options (cwd, env, shell, …).
 *
 * @throws if `commands` is empty.
 */
export function runChain(
  commands: readonly (string | CommandDetail)[],
  opts: ExecOptions = {}
): ChainProcess {
  if (!commands.length) {
    throw new Error('runChain() requires at least one command');
  }

  let current: ChildProcess | null = null;
  let index = 0;
  let lastCode: number | null = 0;
  let finished = false;

  const proc = new EventEmitter() as ChainProcess;

  const _procStdout = new PassThrough();
  const _procStderr = new PassThrough();

  proc.stdout = _procStdout
  proc.stderr = _procStderr

  proc.kill = (signal?: NodeJS.Signals) => current?.kill(signal) ?? false;

  const forward = (child: ChildProcess, _cmd: (string | CommandDetail)) => {
    let _cmdText: string;
    if (typeof _cmd == "string") {
        _cmdText = _cmd;
        child.stdout?.pipe(_procStdout, { end: false });
        child.stderr?.pipe(_procStderr, { end: false });
    } else {
        _cmdText = _cmd.cmd;
        if (_cmd.ignoreStdout) {
            child.stderr?.pipe(_procStdout, { end: false });
        }
        if (_cmd.ignoreStdErr) {
            child.stderr?.pipe(_procStderr, { end: false });
        }
    }

    (['spawn', 'error', 'disconnect', 'message'] as const).forEach(ev =>
      child.on(ev, (...args) => (proc as any).emit(ev, ...args))
    );

    child.on('close', (code, signal) => {
      lastCode = code;
      const data: StepCloseData = { cmd: _cmdText, code, signal };
      (proc as any).emit('stepClose', data);

      index += 1;
      if (index < commands.length) {
        launch();
      } else {
        if (!finished) {
          finished = true;
          _procStdout.end();
          _procStderr.end();
          (proc as any).emit('close', lastCode, signal);
          (proc as any).emit('exit', lastCode, signal);
        }
      }
    });
  };

  const launch = () => {
    const _cmd = commands[index];
    let cmdtext;
    if (typeof _cmd == "string") {
        cmdtext = _cmd;
    } else {
        cmdtext = _cmd.cmd;
    }
    current = exec(cmdtext, opts);
    forward(current, _cmd);
  };

  // Launch on next tick so callers can attach listeners first
  process.nextTick(launch);

  return proc;
}
