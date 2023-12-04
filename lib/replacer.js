import castArray from 'lodash.castarray'
import { visitParents as visit } from 'unist-util-visit-parents'
import { isElement } from 'hast-util-is-element'
import { defaultSlotName } from './constants.js'
import fragment from './fragment.js'

const hasSlotsData = node => node.data?.slots != null

const isSlot = node => isElement(node, 'slot')

const unifyQuery = (value, fallback) => {
	if (value === false) return 'none'
	if (value === true) return 'closest'
	if (['none', 'closest', 'root'].includes(value)) return value
	if (typeof fallback != 'undefined') return fallback

	throw new Error(`Context query can be only boolean, 'none', 'closest' or 'root' but got ${value}`)
}

const findContext = (ancestors, query, fallback = {}) => {
	query = unifyQuery(query)

	if (query === 'none') return fallback
	if (query === 'root') return ancestors[0].data?.slots ?? fallback
	return ancestors.findLast(node => hasSlotsData(node))?.data?.slots ?? fallback
}

const replaceSlots = (tree, {
	values: globalContext,
	context: contextQuery = 'none',
	test: slotTest = isSlot,
} = {}) => {
	if (unifyQuery(contextQuery) === 'none' && globalContext == null) {
		throw new Error('You must pass values when context inferring is disabled')
	}

	visit(tree, slotTest, (node, ancestors) => {
		const allAncestors = [...ancestors, tree]

		const name = node.properties.name ?? defaultSlotName
		const context = findContext(allAncestors, contextQuery, globalContext)
		const value = castArray(context[name] ?? node.children ?? [])

		// The slot must be converted to a fragment instead of unwrapping contents
		// as it could be passed down again to another slot with a different
		// name (or without name) what could lead to a data loss after parsing.
		// The data loss could happen because of slot attribute preserved
		// in the tree what seems to be expected behavior.
		Object.assign(node, fragment(node, value))
	})
}

export default replaceSlots
