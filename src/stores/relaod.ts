import { defineStore } from "pinia"
import { nextTick } from "vue"

export const reload = defineStore("reload", {
  state: () => {
    return {
      show: true as boolean
    }
  },
  getters: {},
  actions: {
    start() {
      this.show = false
      nextTick(() => {
        this.show = true
      }).then(() => {
        this.show = true
      })
    }
  }
})
