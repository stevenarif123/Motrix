const files = import.meta.glob(['./*.js', '!./index.js'], { eager: true })
const modules = {}

Object.keys(files).forEach(key => {
  modules[key.replace(/(\.\/|\.js)/g, '')] = files[key].default
})

export default modules
