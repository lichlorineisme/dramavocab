import { createRouter, createWebHistory } from 'vue-router'
import { useBookStore } from '@/stores/book.js'

const AppShell = () => import('@/components/layout/AppShell.vue')
const HomeView = () => import('@/views/HomeView.vue')
const ReadView = () => import('@/views/ReadView.vue')
const VocabularyView = () => import('@/views/VocabularyView.vue')
const ReviewView = () => import('@/views/ReviewView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const ImportHubView = () => import('@/views/import/ImportHubView.vue')
const ImportProcessedView = () => import('@/views/import/ImportProcessedView.vue')
const ImportPlainView = () => import('@/views/import/ImportPlainView.vue')

const routes = [
  {
    path: '/',
    component: AppShell,
    children: [
      { path: '', name: 'Home', component: HomeView },
      { path: 'library', redirect: '/' },
      { path: 'import', name: 'ImportHub', component: ImportHubView },
      { path: 'import/processed', name: 'ImportProcessed', component: ImportProcessedView },
      { path: 'import/plain', name: 'ImportPlain', component: ImportPlainView },
      { path: 'import/protocol', redirect: '/import' },
      { path: 'vocabulary', name: 'Vocabulary', component: VocabularyView },
      { path: 'review', name: 'Review', component: ReviewView },
      { path: 'dashboard', name: 'Dashboard', component: DashboardView },
      { path: 'login', name: 'Login', component: LoginView },
    ],
  },
  { 
    path: '/read/:bid/:cid?', 
    name: 'Reading', 
    component: ReadView,
    beforeEnter: (to) => {
      if (!to.params.cid) {
        const bookStore = useBookStore()
        const book = bookStore.books.find(b => String(b.id) === String(to.params.bid))
        if (book?.chapters?.length > 0) {
          const firstId = book.chapters[0].id ?? '1'
          return { ...to, params: { ...to.params, cid: firstId } }
        }
      }
    }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

export default router
