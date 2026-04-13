import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBookStore = defineStore('books', () => {
  // State
  const books = ref([])
  const currentBook = ref(null)
  const currentChapter = ref(null)
  const chapters = ref([])
  const isLoading = ref(false)

  // Getters
  const publishedBooks = computed(() => books.value.filter(b => b.status === 'published'))
  const totalBooks = computed(() => publishedBooks.value.length)
  const currentBookTotalVocab = computed(() => currentBook.value?.total_vocab_count || 0)

  // Actions
  function setBooks(data) { books.value = data }
  function setCurrentBook(book) { currentBook.value = book }
  function setCurrentChapter(ch) { currentChapter.value = ch }
  function setChapters(data) { chapters.value = data }

  return {
    books, currentBook, currentChapter, chapters, isLoading,
    publishedBooks, totalBooks, currentBookTotalVocab,
    setBooks, setCurrentBook, setCurrentChapter, setChapters,
  }
})
