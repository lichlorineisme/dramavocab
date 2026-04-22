<template>
  <footer class="site-footer border-t border-white/8 bg-night-950/92 py-9 backdrop-blur-xl">
    <div class="page-container text-center">
      <p class="footer-copy text-sm font-semibold text-white/82">
        © 2026 DramaVocab 抓马英语 · Made with ❤️ by 有栖
      </p>
      <p class="footer-contact mt-1.5 text-sm text-white/58">
        联系作者：
        <a href="mailto:zwenccc@163.com" class="underline-offset-4 hover:underline">zwenccc@163.com</a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
@media (max-width: 640px) {
  .site-footer {
    padding-top: 18px;
    padding-bottom: calc(18px + env(safe-area-inset-bottom));
  }

  .footer-copy {
    font-size: 12px;
    line-height: 1.65;
  }

  .footer-contact {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.55;
    word-break: break-word;
  }
}
</style>
