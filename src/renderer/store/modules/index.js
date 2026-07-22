/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner. Compatible with Vite import.meta.glob.
 */

const files = import.meta.glob('./*.js', { eager: true })
const modules = {}

for (const path in files) {
  if (path === './index.js') continue
  const moduleName = path.replace(/^\.\//, '').replace(/\.js$/, '')
  modules[moduleName] = files[path].default || files[path]
}

export default modules
