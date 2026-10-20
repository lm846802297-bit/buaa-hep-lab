import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'katex/dist/katex.min.css'
import './index.css'

import { applyThemeToDOM, currentColorScheme, currentBgType } from './composables/useThemeStyle'
import { initCustomFont } from './composables/useCustomFont'

applyThemeToDOM(currentColorScheme.value, currentBgType.value)
initCustomFont()

const app = createApp(App)
app.use(router)
// Resolve the public/private route before mounting sidebar and account effects.
router.isReady().then(() => app.mount('#app'))
