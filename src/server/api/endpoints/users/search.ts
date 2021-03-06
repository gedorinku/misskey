import $ from 'cafy';
const escapeRegexp = require('escape-regexp');
import User, { pack, validateUsername, IUser } from '../../../../models/user';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーを検索します。'
	},

	requireCredential: false,

	params: {
		query: {
			validator: $.str,
			desc: {
				'ja-JP': 'クエリ'
			}
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0,
			desc: {
				'ja-JP': 'オフセット'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '取得する数'
			}
		},

		localOnly: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'ローカルユーザーのみ検索対象にするか否か'
			}
		},

		detail: {
			validator: $.bool.optional,
			default: true,
			desc: {
				'ja-JP': '詳細なユーザー情報を含めるか否か'
			}
		},
	},
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const isUsername = validateUsername(ps.query.replace('@', ''), !ps.localOnly);

	let users: IUser[] = [];

	if (isUsername) {
		users = await User
			.find({
				host: null,
				usernameLower: new RegExp('^' + escapeRegexp(ps.query.replace('@', '').toLowerCase()))
			}, {
				limit: ps.limit,
				skip: ps.offset
			});

		if (users.length < ps.limit && !ps.localOnly) {
			const otherUsers = await User
				.find({
					host: { $ne: null },
					usernameLower: new RegExp('^' + escapeRegexp(ps.query.replace('@', '').toLowerCase()))
				}, {
					limit: ps.limit - users.length
				});

			users = users.concat(otherUsers);
		}
	}

	res(await Promise.all(users.map(user => pack(user, me, { detail: ps.detail }))));
}));
