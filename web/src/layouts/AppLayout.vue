<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const navItems = [
  { to: '/', label: '首页', auth: false },
  { to: '/items/new', label: '发布', auth: true },
  { to: '/my/items', label: '我的发布', auth: true },
  { to: '/my/favorites', label: '我的收藏', auth: true },
]

const hideRail = computed(() =>
  ['login', 'register'].includes(String(route.name)),
)

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function go(path: string, needAuth: boolean) {
  if (needAuth && !userStore.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: path } })
    return
  }
  router.push(path)
}

function logout() {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--auth': hideRail }">
    <aside v-if="!hideRail" class="rail">
      <div class="rail__brand">
        <span class="rail__mark">CS</span>
        <div>
          <p class="rail__name">校园集市</p>
          <p class="rail__sub">Campus Board</p>
        </div>
      </div>

      <nav class="rail__nav">
        <button
          v-for="item in navItems"
          :key="item.to"
          type="button"
          class="rail__link"
          :class="{ 'is-active': isActive(item.to) }"
          @click="go(item.to, item.auth)"
        >
          {{ item.label }}
        </button>
      </nav>

      <div class="rail__footer">
        <template v-if="userStore.isLoggedIn">
          <p class="rail__user">{{ userStore.userInfo?.username }}</p>
          <button type="button" class="rail__link rail__link--muted" @click="logout">
            退出
          </button>
        </template>
        <button
          v-else
          type="button"
          class="rail__link"
          :class="{ 'is-active': route.name === 'login' }"
          @click="router.push('/login')"
        >
          登录
        </button>
      </div>
    </aside>

    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--paper);
}

.app-shell--auth {
  display: block;
}

.rail {
  width: 220px;
  flex-shrink: 0;
  background: var(--ink);
  color: #c9cdd1;
  display: flex;
  flex-direction: column;
  padding: 22px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.rail__brand {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 28px;
  padding: 0 8px;
}

.rail__mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--yellow);
  color: var(--ink);
  font-family: var(--font-display);
  font-weight: 700;
  display: grid;
  place-items: center;
}

.rail__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: #fff;
}

.rail__sub {
  margin: 2px 0 0;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9aa1a8;
}

.rail__nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.rail__link {
  appearance: none;
  border: none;
  background: transparent;
  color: #c9cdd1;
  text-align: left;
  padding: 10px 12px;
  border-radius: 9px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.rail__link:hover {
  color: #fff;
}

.rail__link.is-active {
  background: var(--yellow);
  color: var(--ink);
  font-weight: 600;
}

.rail__link--muted {
  opacity: 0.85;
  font-size: 13px;
}

.rail__footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 14px;
}

.rail__user {
  margin: 0 0 8px;
  padding: 0 12px;
  font-size: 13px;
  color: #fff;
}

.main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 48px;
}

@media (max-width: 860px) {
  .app-shell:not(.app-shell--auth) {
    flex-direction: column;
  }

  .rail {
    width: 100%;
    height: auto;
    position: relative;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
  }

  .rail__brand {
    margin-bottom: 0;
  }

  .rail__nav {
    flex-direction: row;
    flex-wrap: wrap;
    flex: 1;
  }

  .rail__footer {
    border-top: none;
    padding-top: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .main {
    padding: 20px 16px 40px;
  }
}
</style>
