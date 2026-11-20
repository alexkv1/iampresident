// One entry per visual state. "proto" = query for the prototype (handoff copy),
// "impl" = path + query for the real app, "get" = /api/match/get fixture, "setup" = JS run after load.
// mode: "fullpage" (landing) or "viewport" (1440x900 screens).
export default [
  { name: 'landing-default', card: '1c', proto: 'freeze', impl: '/?vt=1', mode: 'fullpage' },
  { name: 'landing-claimed-join-private', card: '1c', proto: 'freeze&claim=PRK&name=Alex&mode=Join%20private%20room&code=K7PX2Q', impl: '/?vt=1&claim=PRK&name=Alex&mode=join&code=K7PX2Q', mode: 'fullpage' },
  { name: 'landing-claimed-host', card: '1c', proto: 'freeze&claim=SWE&name=Alex&mode=Host%20private%20room', impl: '/?vt=1&claim=SWE&name=Alex&mode=host', mode: 'fullpage' },
  { name: 'search-connecting', card: '2a', proto: 'freeze&claim=PRK&ft=0.4', impl: '/?vt=1&claim=PRK&search=connecting', mode: 'viewport' },
  { name: 'search-checking', card: '2a', proto: 'freeze&claim=PRK&ft=2.6', impl: '/?vt=1&claim=PRK&search=checking', mode: 'viewport' },
  { name: 'search-found', card: '2a', proto: 'freeze&claim=PRK&ft=5.4', impl: '/?vt=1&claim=PRK&search=found', mode: 'viewport' },
  { name: 'search-entering', card: '2a', proto: 'freeze&claim=PRK&ft=8', impl: '/?vt=1&claim=PRK&search=entering', mode: 'viewport' },
  { name: 'lobby-online-arrival', card: '2b', proto: 'freeze&claim=PRK&name=Alex&ft=2', impl: '/lobby?match=4821&vt=1&claim=PRK', get: 'match-get-joined', mode: 'viewport' },
  { name: 'lobby-online', card: '2b', proto: 'freeze&claim=PRK&name=Alex&ft=7', impl: '/lobby?match=4821&vt=1', get: 'match-get-joined', mode: 'viewport' },
  { name: 'lobby-private-joined', card: '2b', proto: 'freeze&claim=PRK&name=Alex&ft=7&mode=Join%20private%20room&code=K7PX2Q', impl: '/lobby?match=5102&vt=1', get: 'match-get-private-joined', mode: 'viewport' },
  { name: 'lobby-host-alone', card: '2c', proto: 'freeze&claim=PRK&name=Alex&ft=1', impl: '/lobby?match=5101&vt=1', get: 'match-get-host-1', mode: 'viewport' },
  { name: 'lobby-host-friend-joined', card: '2c', proto: 'freeze&claim=PRK&name=Alex&ft=4.5', impl: '/lobby?match=5101&vt=1', get: 'match-get-host-2', setup: "window.IAP_VT.joined('oskar')", mode: 'viewport' },
  { name: 'lobby-host-two-friends', card: '2c', proto: 'freeze&claim=PRK&name=Alex&ft=11.5', impl: '/lobby?match=5101&vt=1', get: 'match-get-host-3', mode: 'viewport' },
];
