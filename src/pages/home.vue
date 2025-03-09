<script setup lang="ts">
import i18nConfig from '@/components/globalConfiguration/i18nConfig.vue'
import { NButton, NLayout, NLayoutContent, NLayoutFooter, NLayoutHeader, NSpace } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

function jumpLogin() {
  router.push('/login')
}
</script>

<template>
  <NSpace>
    <NLayout>
      <NLayoutHeader class="NLayoutHeader">
        <div class="logo">
          <img src="../assets/logo.svg" alt="logo">
        </div>
        <div>
          <span>ODOT</span>
        </div>
        <div class="right-container">
          <div class="textLink">
            <a href="#">{{ $t('functionIntroduction') }}</a>
            <a href="#">{{ $t('help') }}</a>
          </div>
          <div class="config-container">
            <i18nConfig />
          </div>
        </div>
      </NLayoutHeader>
      <NLayoutContent class="NLayoutContent">
        <NButton @click="jumpLogin()">
          {{ $t('startInUse') }}
        </NButton>
      </NLayoutContent>

      <NLayoutFooter class="NLayoutFooter">
        <div>ODOT-Team</div>
      </NLayoutFooter>
    </NLayout>
  </NSpace>
</template>

<style lang="css" scoped>
.NLayoutHeader {
  width: 100vw;
  height: 50px;
  display: flex;
  align-items: center;
  .logo {
    margin-left: 20px;
    img {
      height: 40px;
    }
  }
  .right-container {
    display: flex;
    align-items: center;
    margin-left: auto; /* 将整个容器推到最右边 */
    margin-right: 40px; /* 留出 20px 的空白 */
  }
  .textLink {
    display: flex;
    align-items: center;
    margin-right: 20px; /* 在链接和按钮之间留出 20px 的空白 */
    a {
      margin-right: 10px; /* 在链接之间留出 10px 的空白 */
      text-decoration: none;
      color: inherit;
      font-size: large;
    }
  }
  .config-container {
    display: flex;
    align-items: center;
    gap: 10px; /* 使用 gap 属性在两个按钮之间添加 10px 的间距 */
  }
}
.NLayoutContent {
  width: 100vw;
  height: 900px;
}
.NLayoutFooter {
  display: flex;
  justify-content: center;
}
</style>
