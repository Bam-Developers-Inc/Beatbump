import { browser } from '$app/env'
import { get, writable } from 'svelte/store'

export const playbackStatus = writable({})

export const updateTrack = updateSource()
export const ctxKey = {}
export const currentSource = writable(undefined)
export const currentTitle = writable(undefined)
export const currentArtist = writable('')
export const index = writable([{}])
export const continuation = writable('')
export const searchManager = _searchIndex()
export const currentTrack = writable({
	continuation: '',
	id: '',
	videoId: '',
	title: '',
	artist: '',
	thumbnail: '',
	length: ''
})
export const theme = _theme()
export const currentMix = writable({
	videoId: '',
	playlistId: '',
	list: [
		{ id: '', videoId: '', thumbnail: '', artist: '', title: '', length: '' }
	]
})
export const list = writable([{}])
export const autoMix = writable({})
export const key = writable(0)
export const iOS = _verifyUserAgent()
export function updateSource() {
	const { subscribe, set, update } = writable(undefined)
	return {
		subscribe,
		set,
		update,
		get: (src) => get(updateTrack),
		add: (src) => {
			src
		},
		reset: () => set(0)
	}
}

function _searchIndex() {
	const { subscribe, set, update } = writable([])
	return {
		subscribe,
		set,
		update,
		get: (arr) => get(arr),
		reset: () => {
			set([])
		}
	}
}

function _verifyUserAgent() {
	const { subscribe, set, update } = writable(undefined)
	let CheckiOS
	let isApple
	if (browser) {
		CheckiOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent)
		isApple = CheckiOS ? true : false
	}
	browser ? console.log(isApple, CheckiOS) : null

	return {
		subscribe,
		set,
		update,
		get: (user) => get(iOS),
		init: () => {
			set(isApple)
			browser ? localStorage.setItem('iOSClient', isApple) : null
		},
		reset: () => {
			set(undefined)
			browser ? localStorage.removeItem('iOSClient') : null
		}
	}
}

function _theme() {
	const { subscribe, set, update } = writable('')
	return {
		subscribe,
		set,
		update,
		get: (name) => get(theme),
		init: (name) => {
			// if (localStorage.getItem('theme')) return;
			set(name)
			localStorage.setItem('theme', name)
		},
		reset: () => {
			set(undefined)
			browser ? localStorage.removeItem('theme') : null
		}
	}
}