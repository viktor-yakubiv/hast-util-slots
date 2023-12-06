import castArray from 'lodash.castarray'
import { visit, SKIP } from 'unist-util-visit'
import { isElement } from 'hast-util-is-element'
import { defaultSlotName } from './constants.js'
import fragment from './fragment.js'

const isSlot = node => isElement(node, 'slot')

const replaceSlots = (tree, values = {}, {
	test: slotTest = isSlot,
	preserveOmitted = false,
} = {}) => {
	const unwrapEmpty = !preserveOmitted

	visit(tree, slotTest, (node) => {
		const name = node.properties.name ?? defaultSlotName
		const value = castArray(values[name] ?? node.children ?? [])

		if (values[name] != null || unwrapEmpty) {
			// The slot must be converted to a fragment
			// instead of unwrapping contents as it could be passed down again
			// to another slot with a different or without any name,
			// what could lead to data loss after parsing.
			// Also, the user might store extra data on the `<slot>` node
			// that is still needed. It is up to the user to clean up fragments
			// after this utility.
			//
			// The data loss could happen because of slot attribute
			// preserved in the tree what is an expected behaviour.
			// This can be illustrated with the following example:
			//
			// ```html
			// <parent-element>
			//   <child-element slot=default>
			//     <span slot=default>Double-slotted text</span>
			//   </child-element>
			// </parent-element>
			// ```
			Object.assign(node, fragment(node, value))
		}

		// No need to continue with slot's children -
		// it either should be skipped or was already replaced
		return SKIP
	})

	return tree
}

export default replaceSlots
