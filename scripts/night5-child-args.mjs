import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// --import accepts a module URL. A Windows drive path is parsed as a c: scheme.
export function night5ChildArgs(source,script,argv) {
 return script.endsWith('.ts')
  ? ['--import',pathToFileURL(resolve(source,'server/node_modules/tsx/dist/loader.mjs')).href,'--conditions=development',script,...argv]
  : [script,...argv];
}
