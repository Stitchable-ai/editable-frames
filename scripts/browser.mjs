import path from 'node:path';
import {statSync} from 'node:fs';

// Explicit opt-in to a locally managed Chromium; never download or silently
// substitute a different browser when the Playwright-managed one is missing.
export function chromiumOptions(env = process.env) {
 const executablePath = env.EDITABLEFRAMES_CHROMIUM_EXECUTABLE;
 if (!executablePath) return {};
 if (!path.isAbsolute(executablePath)) throw Error('EDITABLEFRAMES_CHROMIUM_EXECUTABLE must be an absolute path');
 let file;
 try { file = statSync(executablePath); } catch { throw Error('EDITABLEFRAMES_CHROMIUM_EXECUTABLE does not name an existing file'); }
 if (!file.isFile()) throw Error('EDITABLEFRAMES_CHROMIUM_EXECUTABLE must name a browser executable file');
 return {executablePath};
}
