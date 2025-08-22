import './assets/main.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { ViewTransitionsPlugin } from 'vue-view-transitions'
import App from './App.vue'
// import router from './router'

const app = createApp(App)

app.use(createPinia())
// app.use(router)
app.use(ViewTransitionsPlugin())
app.mount('#app')
