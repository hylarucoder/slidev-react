import { useDeck } from '../../app/providers/DeckProvider'

export function useDeckNavigation() {
  const deck = useDeck()

  return {
    currentIndex: deck.currentIndex,
    total: deck.total,
    next: deck.next,
    prev: deck.prev,
    first: deck.first,
    last: deck.last,
    goTo: deck.goTo,
  }
}
