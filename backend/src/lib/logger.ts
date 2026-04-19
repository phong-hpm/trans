// logger.ts — Structured request/response logger with chalk colours

import chalk from 'chalk';

const timestamp = () => chalk.gray(new Date().toISOString());

const serialize = (data: unknown): string => {
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
};

class Logger {
  request(method: string, url: string, body: unknown): void {
    console.log(`${timestamp()} ${chalk.cyan('→')} ${chalk.bold(method)} ${chalk.white(url)} ${chalk.gray(serialize(body))}`);
  }

  success(method: string, url: string, status: number, body: unknown): void {
    console.log(`${timestamp()} ${chalk.green('✓')} ${chalk.bold(method)} ${chalk.white(url)} ${chalk.green(status)} ${chalk.gray(serialize(body))}`);
  }

  error(method: string, url: string, status: number, message: string): void {
    console.log(`${timestamp()} ${chalk.red('✗')} ${chalk.bold(method)} ${chalk.white(url)} ${chalk.red(status)} ${chalk.red(message)}`);
  }

  info(message: string): void {
    console.log(`${timestamp()} ${chalk.blue('ℹ')} ${chalk.white(message)}`);
  }
}

export const logger = new Logger();
