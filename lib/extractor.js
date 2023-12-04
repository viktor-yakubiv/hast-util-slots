import { defaultSlotName } from './constants.js'

const collectSlots = nodeList => nodeList.reduce((slots, node) => {
	const name = node.properties?.slot ?? defaultSlotName

	if (!slots.has(name)) slots.set(name, [])

	slots.get(name).push(node)

	return slots
}, new Map())

const extractSlots = (node, { storeData = false, } = {}) => {
	const slotMap = collectSlots(node.children ?? [])
	const slots = Object.fromEntries(slotMap.entries)

	if (storeData) {
		node.data = Object.assign(node.data ?? {}, { slots })
	}

	return slots
}

export default extractSlots
