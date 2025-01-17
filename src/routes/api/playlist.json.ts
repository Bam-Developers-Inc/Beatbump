import {
	MusicResponsiveListItemRenderer,
	MusicTwoRowItemRenderer
} from '$lib/parsers';

import type { CarouselHeader, CarouselItem } from '$lib/types';
import type { NextContinuationData } from '$lib/types';
import type { IListItemRenderer } from '$lib/types/musicListItemRenderer';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ url }) => {
	const query = url.searchParams;
	const browseId = query.get('list') || '';
	const itct = query.get('itct') || '';
	const ctoken = query.get('ctoken') || '';
	const referrer = query.get('ref') || '';

	// console.log(browseId, ctoken)

	if (ctoken !== '') {
		return getPlaylistContinuation(browseId, referrer, ctoken, itct);
	}
	return getPlaylist(browseId, referrer);
};
async function getPlaylistContinuation(browseId, referrer, ctoken, itct) {
	const response = await fetch(
		`https://music.youtube.com/youtubei/v1/browse?ctoken=${ctoken}` +
			`&continuation=${ctoken}&type=next&itct=${itct}&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30`,
		{
			method: 'POST',
			body: JSON.stringify({
				context: {
					client: {
						clientName: 'WEB_REMIX',
						clientVersion: '1.20211025.00.00',
						visitorData: 'CgtQc1BrdVJNNVdNRSiImZ6KBg%3D%3D'
					},
					user: {
						lockedSafetyMode: false
					}
				}
			}),
			headers: {
				'Content-Type': 'application/json; charset=utf-8',

				'X-Goog-AuthUser': '0',
				Origin: 'https://music.youtube.com',
				'x-origin': 'https://music.youtube.com',

				'X-Goog-Visitor-Id': 'CgtQc1BrdVJNNVdNRSiImZ6KBg%3D%3D',
				referer:
					'https://music.youtube.com/playlist?list=' + referrer.slice(2) ||
					browseId
			}
		}
	);
	if (!response.ok) {
		return { status: response.status, body: response.statusText };
	}

	const data = await response.json();
	const {
		continuationContents: {
			musicPlaylistShelfContinuation: { contents = [], continuations = [] } = {}
		} = {}
	} = await data;
	// console.log(data, contents, continuations)
	let Tracks = [];
	let Carousel;
	const cont: NextContinuationData = continuations
		? continuations[0]?.nextContinuationData
		: null;
	if (
		data?.continuationContents?.sectionListContinuation?.contents[0]
			?.musicCarouselShelfRenderer
	) {
		Carousel = parseCarousel({
			musicCarouselShelfRenderer:
				data?.continuationContents?.sectionListContinuation?.contents[0]
					?.musicCarouselShelfRenderer
		});
		// console.log(Carousel, contents[0])
		// console.log(referrer.slice(1))
	} else {
		Tracks = parseTrack(contents, referrer.slice(2));
	}
	return {
		status: 200,
		body: JSON.stringify({
			continuations: cont,
			tracks: Tracks.length !== 0 && Tracks,
			carousel: Carousel
		})
	};
}
async function getPlaylist(browseId, referrer) {
	const response = await fetch(
		'https://music.youtube.com/youtubei/v1/browse?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30',
		{
			method: 'POST',
			body: JSON.stringify({
				context: {
					client: {
						clientName: 'WEB_REMIX',
						clientVersion: '1.20211025.00.00',
						visitorData: 'CgtQc1BrdVJNNVdNRSiImZ6KBg%3D%3D'
					},

					user: {
						lockedSafetyMode: false
					}
				},
				browseId: `${browseId}`,
				browseEndpointContextMusicConfig: {
					pageType: 'MUSIC_PAGE_TYPE_PLAYLIST'
				}
			}),
			headers: {
				'Content-Type': 'application/json; charset=utf-8',

				'X-Goog-AuthUser': '0',
				Origin: 'https://music.youtube.com',
				'x-origin': 'https://music.youtube.com',
				'X-Goog-Visitor-Id': 'CgtQc1BrdVJNNVdNRSiImZ6KBg%3D%3D',
				referer:
					'https://music.youtube.com/playlist?list=' + referrer || browseId
			}
		}
	);
	if (!response.ok) {
		return { status: response.status, body: response.statusText };
	}
	const data = await response.json();
	let { musicDetailHeaderRenderer = {} } = data?.header;
	const {
		contents,
		playlistId,
		continuations
	} = data?.contents?.singleColumnBrowseResultsRenderer?.tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents[0]?.musicPlaylistShelfRenderer;
	const _continue =
		data?.contents?.singleColumnBrowseResultsRenderer?.tabs[0]?.tabRenderer
			?.content?.sectionListRenderer?.continuations || null;

	// console.log(musicDetailHeaderRenderer)
	const cont: NextContinuationData = data?.contents
		?.singleColumnBrowseResultsRenderer?.tabs[0]?.tabRenderer?.content
		?.sectionListRenderer?.continuations
		? data?.contents?.singleColumnBrowseResultsRenderer?.tabs[0]?.tabRenderer
				?.content?.sectionListRenderer?.continuations[0]?.nextContinuationData
			? continuations !== undefined && continuations[0]?.nextContinuationData
			: _continue !== null && _continue[0]?.nextContinuationData
		: null;
	// console.log(_continue)
	musicDetailHeaderRenderer = [musicDetailHeaderRenderer];
	const parseHeader = musicDetailHeaderRenderer.map(
		({
			description = {},
			subtitle = {},
			thumbnail = {},
			secondSubtitle = {},
			title = {}
		}) => {
			let subtitles = [];
			let _secondSubtitle = [];
			if (Array.isArray(subtitle?.runs) && subtitle?.runs.length !== 0) {
				for (const { text } of subtitle?.runs) {
					subtitles = [...subtitles, text];
				}
			}
			if (
				Array.isArray(secondSubtitle?.runs) &&
				secondSubtitle?.runs.length !== 0
			) {
				for (const { text } of secondSubtitle?.runs) {
					_secondSubtitle = [..._secondSubtitle, text];
				}
			}
			// const subtitles = [...subtitle?.runs]
			const desc =
				(description &&
					Array.isArray(description?.runs) &&
					description?.runs[0]?.text) ??
				undefined;
			const _title =
				(title && Array.isArray(title?.runs) && title?.runs[0]?.text) ??
				undefined;
			return {
				description: desc,
				subtitles,
				thumbnails:
					thumbnail?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails ||
					null,
				playlistId: playlistId,
				secondSubtitle: _secondSubtitle,
				title: _title || 'error'
			};
		}
	)[0];
	// const [contents] = playlist;

	const tracks = parseTrack(contents, playlistId).filter((e) => {
		return e != null;
	});
	// console.log('TRACKS: ' + tracks);
	return {
		status: 200,
		body: JSON.stringify({
			continuations: cont,
			tracks,
			carouselContinuations: _continue && _continue[0].nextContinuationData,
			header: parseHeader
		})
	};
}
function parseTrack(contents = [], playlistId?): Array<IListItemRenderer> {
	let Tracks = [];
	for (let index = 0; index < contents.length; index++) {
		const element = contents[index];
		Tracks = [
			...Tracks,
			MusicResponsiveListItemRenderer(element, true, playlistId)
		];
	}
	return Tracks;
}
function parseHeader(header: any[]): CarouselHeader[] {
	return header.map(({ musicCarouselShelfBasicHeaderRenderer } = {}) => ({
		title: musicCarouselShelfBasicHeaderRenderer['title']['runs'][0].text
	}));
}

function parseBody(contents): CarouselItem[] {
	return contents.map(({ ...r }) => {
		if (r.musicTwoRowItemRenderer) {
			return MusicTwoRowItemRenderer(r);
		}
		if (r.musicResponsiveListItemRenderer) {
			return MusicResponsiveListItemRenderer(r);
		}
		throw new Error("Unable to parse items, can't find " + `${r}`);
	});
}
function parseCarousel({ musicCarouselShelfRenderer }) {
	return {
		header: parseHeader([musicCarouselShelfRenderer.header])[0],
		results: parseBody(musicCarouselShelfRenderer.contents)
	};
}
