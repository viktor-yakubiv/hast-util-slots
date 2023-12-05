import { h } from 'hastscript'
import { extract, replace } from './index.js'

describe('slot extractor', () => {
	it('returns an empty object on the empty input', () => {
		expect(extract(h())).toStrictEqual({})
	})

	it('gathers elements with slot properties to corresponding object values', () => {
		const first = h('p', { slot: 'first' }, 'Hello')
		const second = h('p', { slot: 'second' }, 'World')
		const tree = h(null, [first, second])

		expect(extract(tree)).toStrictEqual({
			first: [first],
			second: [second],
		})
	})

	it('ignores nested elements with slot property', () => {
		const child = h('span', { slot: 'child' }, 'Hi there!')
		const parent = h('p', { slot: 'parent' }, [child])
		const tree = h(null, [parent])

		expect(extract(tree)).toStrictEqual({
			parent: [parent],
		})
	})

	it('collects all nodes without slot porperty with the default key', () => {
		const tree = h(null, [
			h('h1', { slot: 'title' }, 'Title'),
			' ',
			h('p', 'First paragraph'),
			'\n',
			h('p', 'Second paragraph'),
			h('footer', { slot: 'footer' }, [
				h('p', 'Footer'),
			]),
			'\n',
		])

		expect(extract(tree)).toStrictEqual({
			// default key is an empty string by the spec
			['']: h(null, [ 
				' ',
				h('p', 'First paragraph'),
				'\n',
				h('p', 'Second paragraph'),
				'\n',
			]).children,
			title: [
				h('h1', { slot: 'title' }, 'Title'),
			],
			footer: [
				h('footer', { slot: 'footer' }, [
					h('p', 'Footer'),
				]),
			],
		})
	})
})
