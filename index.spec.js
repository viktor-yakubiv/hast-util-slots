import { h } from 'hastscript'
import { isElement } from 'hast-util-is-element'
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

describe('slot replacer', () => {
	it('converts slots to fragments', () => {
		const fragment = h(null)
		expect(replace(h('slot'))).toMatchObject(fragment)
	})

	const fragment = slot => Object.assign(slot, { type: 'root' })

	it('substitutes slots on any level with passed values', () => {
		const tree = h(null, [
			h('div', [h('slot', { name: 'nested' })]),
			h('slot', { name: 'child' }),
			h('div', [h('slot')]),
		])

		const values = {
			['']: [h('span', 'default'), { type: 'text', value: 'also with text' }],
			nested: [h('span', { slot: 'nested' })],
			child: [h('span', { slot: 'child' })],
		}

		const expected = h(null, [
			h('div', [
				h('slot', { name: 'nested' }, [
					h('span', { slot: 'nested' }),
				]),
			]),
			h('slot', { name: 'child' }, [
				h('span', { slot: 'child' }),
			]),
			h('div', [
				h('slot', values['']),
			]),
		])
		fragment(expected.children[0].children[0])
		fragment(expected.children[1])
		fragment(expected.children[2].children[0])

		expect(replace(tree, values)).toEqual(expected);
	})

	it('unwraps slots that do not have a substitution', () => {
		const tree = h(null, [
			h('slot', [h('span', 'default')]),
			h('slot', { name: 'replaced' }, 'not replaced'),
		])

		const values = { replaced: [h('span', { slots: 'replaced' }, 'replaced')] }

		const expected = h(null, [
			h('slot', [h('span', 'default')]),
			h('slot', { name: 'replaced' }, values.replaced),
		])
		fragment(expected.children[0])
		fragment(expected.children[1])

		expect(replace(tree, values)).toEqual(expected)
	})

	it('preserves slot\'s data', () => {
		const tree = h(null, [h('slot')])
		tree.children[0].data = { entry: 'value' }

		const values = { ['']: [h('span', 'text')] }

		const expected = h(null, [])
		expected.children.push(fragment({ ...tree.children[0] }))
		expected.children[0].children = values['']

		expect(replace(tree, values)).toEqual(expected)
	})

	it('allows to disable unwrapping defaults', () => {
		const tree = h(null, [
			h('slot', [h('span', 'default')]),
			h('slot', { name: 'replaced' }, 'not replaced'),
		])

		const values = { replaced: [h('span', { slots: 'replaced' }, 'replaced')] }

		const expected = h(null, [
			h('slot', [h('span', 'default')]),
			h('slot', { name: 'replaced' }, values.replaced),
		])
		fragment(expected.children[1])

		expect(replace(tree, values, { preserveOmitted: true })).toEqual(expected)
	})

	it('allows to have custom test for slots', () => {
		const tree = h(null, [
			h('slot', [h('span', 'not replaced')]),
			h('div', 'should be replaced'),
			h('slot', { name: 'named' }, 'should be repalced'),
		])

		const values = {
			['']: [h('span', 'replaced div')],
			named: [h('span', { slot: 'named' }, 'replaced slot')],
		}

		const expected = h(null, [
			h('slot', [h('span', 'not replaced')]),
			h('div', values['']),
			h('slot', { name: 'named' }, values.named),
		])
		fragment(expected.children[1])
		fragment(expected.children[2])

		const test = [
			node => isElement(node, 'slot') && node.properties.name === 'named',
			node => isElement(node, 'div'),
		]

		expect(replace(tree, values, { test })).toEqual(expected)
	})

	it('does not fall into endless loop when a slot is replaced with anothe slot', () => {
		const tree = h(null, [h('slot', 'a slot')])
		const values = { '': [h('slot', 'another slot')] }
		const expected = h(null, [h('slot', [h('slot', 'another slot')])])
		fragment(expected.children[0])

		expect(replace(tree, values)).toEqual(expected)
	})
})
