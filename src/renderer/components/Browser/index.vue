<template>
  <div ref="webviewViewport" class="webview-viewport">
    <iframe
      class="mo-webview"
      ref="iframe"
      :src="src"
    ></iframe>
  </div>
</template>

<script>
  import is from 'electron-is'
  import { Loading } from 'element-ui'

  export default {
    name: 'mo-browser',
    components: {
    },
    props: {
      src: {
        type: String,
        default: ''
      }
    },
    data () {
      return {
        loading: null
      }
    },
    computed: {
      isRenderer: () => is.renderer()
    },
    mounted () {
      const { iframe } = this.$refs

      this.loadStart()
      iframe.addEventListener('load', this.loadStop.bind(this))
    },
    methods: {
      loadStart () {
        const { webviewViewport } = this.$refs
        this.loading = Loading.service({
          target: webviewViewport
        })
      },
      loadStop () {
        this.$nextTick(() => {
          this.loading && this.loading.close()
        })
      }
    }
  }
</script>

<style lang="scss">
.webview-viewport {
  position: relative;
}
.mo-webview {
  display: inline-flex;;
  flex: 1;
  flex-basis: auto;
}
</style>
