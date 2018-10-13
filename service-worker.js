/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["/about/index.html","84bbebfb26e3a348fa835debb95ff6da"],["/archives/index.html","547d1d06865c7635211db78e8d193c57"],["/assets/css/components/boxed-group.css","4a030b6ac84027a92722b7002f892dc2"],["/assets/css/components/collection.css","747dd2a9a27c8e57e84ace3f66b9084d"],["/assets/css/components/repo-card.css","b0fa699f3d97b5f55544ee8b95fbcf0d"],["/assets/css/globals/common.css","57067f11b60bbea9195217d217ec3961"],["/assets/css/globals/donate.css","b1c60d10a0d8ee53aba488cc95f3c6e3"],["/assets/css/globals/prism.css","1c21a3d92b4196a9f09163bd118bd65c"],["/assets/css/globals/responsive.css","0d53fda50aea1b20848e24b96c47d241"],["/assets/css/modules/sidebar-search.css","7c51e7154ab7bcc4c0dbc01fe411c963"],["/assets/css/pages/index.css","fbb1562e571ed8253c1a000907504154"],["/assets/css/posts/index.css","2ff02205d771a94f3e0b810242b578ef"],["/assets/css/pygments/default.css","91c1ba201558f66ea8859b0338378686"],["/assets/css/sections/article.css","d41d8cd98f00b204e9800998ecf8427e"],["/assets/css/sections/mini-repo-list.css","20dd98cf2f7091a9fbc5390541b04483"],["/assets/css/sections/repo-list.css","8e7fe4b9daba468e011f1a08ca6816c6"],["/assets/css/style.css","0b73f80c9b4d779390505ce52a7344b3"],["/assets/images/octicons-bg.png","708ff94376f2e3d8b4a8a6898543fac6"],["/assets/images/octocat-spinner-16px.gif","ff0db9570ff08ef6676623df43fa83f2"],["/assets/images/octocat-spinner-32-EAF2F5.gif","e42df318eebdaec3aae190c047431da6"],["/assets/images/qrcode.jpg","24df4cd37706f27d84ad7a1dd05cebe4"],["/assets/images/screenshots/home.png","b29092ff665e322a4701c109086c3a8b"],["/assets/js/flow.js","e5c90b5a007b3d3b49fce50cd5520d1c"],["/assets/js/geopattern.js","51e30ada689c37c70ec3a5478a888544"],["/assets/js/jquery-ui.js","43109e12e36805738ddf8deca737c53b"],["/assets/js/jquery.toc.js","6ea2d20134880ccee2f8e646700627e9"],["/assets/js/main.js","7ca5398c6422f290a8d09d1ac5742f58"],["/assets/js/mermaid.min.js","e80772ad2ac99b0d785ee184648033a8"],["/assets/js/prism.js","8ef2a267de38cf74683bda743529fc02"],["/assets/js/raphael.min.js","8d4578ea4f1217f5aa3c20a0c73a0473"],["/assets/js/search.js","04a32438aeaecbe34b48420c63b395f2"],["/assets/js/simple-jekyll-search.min.js","fe67011e5dc75e4143d4c9751d063b14"],["/assets/js/snap.svg-min.js","4d32220e1d95ea0866e009e33638fa60"],["/assets/js/underscore-min.js","8723d0be75d147cd7cd095721996b0f8"],["/assets/js/webfont.js","c752dd064f814f1ee3df87a7f0705d8f"],["/assets/search_data.json","d3a34d3d83a1952f5b19906e6d89ad67"],["/assets/vendor/flowchart.js/dist/flowchart.js","a2dbb593b932674fe5fe69000e48f52d"],["/assets/vendor/flowchart.js/dist/flowchart.js.map","364a91d8a384754a720fe75e7a9571bd"],["/assets/vendor/flowchart.js/dist/flowchart.min.js","a30e7b3b24ba8e2f66f700780151591e"],["/assets/vendor/flowchart.js/dist/flowchart.min.js.map","f73e9cd06b675d7b29d9e2f52663da5a"],["/assets/vendor/jquery/dist/jquery.min.js","6326c600df01e3bfb9b40e1aa08176f8"],["/assets/vendor/jquery/dist/jquery.min.map","2d03a9e84c18b0c9ca7ae86efd7857f8"],["/assets/vendor/js-sequence-diagrams/dist/danielbd.woff","e77b34d4fff49fdb4f7ac7a844e4cd88"],["/assets/vendor/js-sequence-diagrams/dist/danielbd.woff2","a0b95276d085f896028de31223739b2e"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-min.css","96d28856dde32daa238bd4522c04f97e"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-min.js","ad729490079037cb8a182e84d3d71550"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-min.js.map","ba8e7753641acc494554574cc3916faa"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-raphael-min.js","7551e53d37e7f375235e6b80c4a3e928"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-raphael-min.js.map","f5036d7c9423e18a311c7aaf4a971594"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-raphael.js","aa536a3fcd11bc2719b9dd9bdc418c4a"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-snap-min.js","3b1dc4944034e69f952a1c361e593b8b"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-snap-min.js.map","b9ed8f7236d58e01410c1d134454883e"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram-snap.js","0e6307135f37af60821abd1a4298eaaa"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram.css","5256045fae20936a94c87168789571f9"],["/assets/vendor/js-sequence-diagrams/dist/sequence-diagram.js","8fb004d2b547783aa3fbb7cb62075319"],["/assets/vendor/octicons/octicons/octicons-local.ttf","72e4167c13648cb89e9e96cdd212cb82"],["/assets/vendor/octicons/octicons/octicons.css","4eda81d8f6467bea96cbb0403c2efba8"],["/assets/vendor/octicons/octicons/octicons.eot","0a82c1edade24862533bbe96ebeaea47"],["/assets/vendor/octicons/octicons/octicons.svg","3ab967e88e7ac684ff5d06da67573c7c"],["/assets/vendor/octicons/octicons/octicons.ttf","103abd6cc0199e2519ef6f1aac4bb0e0"],["/assets/vendor/octicons/octicons/octicons.woff","be82065223a03ba577de159d97a5d63d"],["/assets/vendor/octicons/svg/alert.svg","d01f0cced526ee3fd5bd3a082271f41f"],["/assets/vendor/octicons/svg/arrow-down.svg","e35f20ac84013a8464362316707df1f0"],["/assets/vendor/octicons/svg/arrow-left.svg","00c9a59838f57c6b9a5c022ce2b90daf"],["/assets/vendor/octicons/svg/arrow-right.svg","ba0e3c52fa91277a813cc5b995aa844b"],["/assets/vendor/octicons/svg/arrow-small-down.svg","f81ff5b276f47d4b675e721c589017f6"],["/assets/vendor/octicons/svg/arrow-small-left.svg","34bf284adeabb04c22b9cf9150583e8b"],["/assets/vendor/octicons/svg/arrow-small-right.svg","b3fb663f4ef3d4819eb7c49bd5256c16"],["/assets/vendor/octicons/svg/arrow-small-up.svg","96de64339efb2ec4be71199786971502"],["/assets/vendor/octicons/svg/arrow-up.svg","0d539325e5c56fcd77f3351035bc5ed5"],["/assets/vendor/octicons/svg/beaker.svg","13858aff3ff8d382a2b578b54ad06f2b"],["/assets/vendor/octicons/svg/bell.svg","f8418a457f53332d7d9b96d41034b327"],["/assets/vendor/octicons/svg/book.svg","90e261fa1493ca7208faa29c1998625f"],["/assets/vendor/octicons/svg/bookmark.svg","baac92efc27a72c19ca0be24892d01d9"],["/assets/vendor/octicons/svg/briefcase.svg","bebde682850501d4671d79630dd97eb8"],["/assets/vendor/octicons/svg/broadcast.svg","58e13fb832ba3e5615adb6b7a6f32cb9"],["/assets/vendor/octicons/svg/browser.svg","96fdd94f62bcac77fae64aaa1d8d0078"],["/assets/vendor/octicons/svg/bug.svg","9f4fcc3fe23f429ad66befb684550404"],["/assets/vendor/octicons/svg/calendar.svg","1d16f1cda7dab8272ee07768a73505a3"],["/assets/vendor/octicons/svg/check.svg","bb2a37d44697190638042f6e996686f3"],["/assets/vendor/octicons/svg/checklist.svg","593250f80cdad928a87a19e7175fc3dc"],["/assets/vendor/octicons/svg/chevron-down.svg","3c267118e6b49399374ee9d53ff85405"],["/assets/vendor/octicons/svg/chevron-left.svg","5fbfb360668b4834eb7f147e1236631b"],["/assets/vendor/octicons/svg/chevron-right.svg","91911421063818868a6b5f62e181ee2d"],["/assets/vendor/octicons/svg/chevron-up.svg","2c537c8d01d370540efa9385b350857f"],["/assets/vendor/octicons/svg/circle-slash.svg","e2cbecdb580b24b94ab472181fede512"],["/assets/vendor/octicons/svg/circuit-board.svg","eedf1a6c0d6cf1ed8e7820bbdc22c8e2"],["/assets/vendor/octicons/svg/clippy.svg","8d2901b8951c2b31534d820a9b2b1147"],["/assets/vendor/octicons/svg/clock.svg","f77dc9bdbc01156bf574f9d6deb8be19"],["/assets/vendor/octicons/svg/cloud-download.svg","d0fc9263e8f0f009f5779c5713fc4fcb"],["/assets/vendor/octicons/svg/cloud-upload.svg","5c96d40170e786f0be5de16303844809"],["/assets/vendor/octicons/svg/code.svg","0eacbf928c38f36cccea90a2d5cc59ef"],["/assets/vendor/octicons/svg/color-mode.svg","675ff6d8453fe1fa3a88d4194f28de35"],["/assets/vendor/octicons/svg/comment-discussion.svg","9e1d046ac8a6161be61b56d81b641ac5"],["/assets/vendor/octicons/svg/comment.svg","271c6643551b8cbc2f0c4ef98cf23137"],["/assets/vendor/octicons/svg/credit-card.svg","7e661e764f9fc34a2a4c84d32452ea8e"],["/assets/vendor/octicons/svg/dash.svg","8323545878092f05769065088a9da353"],["/assets/vendor/octicons/svg/dashboard.svg","2da41de8e6acbc8ae261c0bb894e961a"],["/assets/vendor/octicons/svg/database.svg","e435ae6e3537e21e34c93ca9bc51db8a"],["/assets/vendor/octicons/svg/desktop-download.svg","7d1a4b592d6708e36112773eb58d034d"],["/assets/vendor/octicons/svg/device-camera-video.svg","a098b4c50c2fa38b260c7ca478ac900d"],["/assets/vendor/octicons/svg/device-camera.svg","d3c77301c76a7fd266346222dfb0947e"],["/assets/vendor/octicons/svg/device-desktop.svg","9383bd77dd0ba0b72e934f2f423a4078"],["/assets/vendor/octicons/svg/device-mobile.svg","34656543dea5a23d2b36ea7861b11906"],["/assets/vendor/octicons/svg/diff-added.svg","ecdd2ad4fb5033e5477a07af43f25cbd"],["/assets/vendor/octicons/svg/diff-ignored.svg","e87c438ae10b300a5ed9fd0771a8241e"],["/assets/vendor/octicons/svg/diff-modified.svg","d439258c6f27b27af46585cdcb5b34dc"],["/assets/vendor/octicons/svg/diff-removed.svg","5325cdf03b062937cabc8e32848ebad2"],["/assets/vendor/octicons/svg/diff-renamed.svg","a140552dd8a2c56cc38591a269f88da5"],["/assets/vendor/octicons/svg/diff.svg","815d65db53a86145d326386df95bc29a"],["/assets/vendor/octicons/svg/ellipsis.svg","c7cd43d41e37cc07a15f3c1f091fe5d0"],["/assets/vendor/octicons/svg/eye.svg","04f4244c26d994fc77546ac91430ae6d"],["/assets/vendor/octicons/svg/file-binary.svg","762150133aaed19563b6f9fc5a34e188"],["/assets/vendor/octicons/svg/file-code.svg","a1b6447eedc9a2ad337915f4cf3a43b6"],["/assets/vendor/octicons/svg/file-directory.svg","cd6bae33eb47e2037a96f60eaed78bd7"],["/assets/vendor/octicons/svg/file-media.svg","9d2157f01702bf8b56657168928bd144"],["/assets/vendor/octicons/svg/file-pdf.svg","331dc422f45cd0a7c371680989c61085"],["/assets/vendor/octicons/svg/file-submodule.svg","5fdf4afca8ffdabaa8a65a46b91859e5"],["/assets/vendor/octicons/svg/file-symlink-directory.svg","e6c9cd085837ef4cdb46c6c7d3e84c0c"],["/assets/vendor/octicons/svg/file-symlink-file.svg","9a32eb31086924f0806b96bd22f330a7"],["/assets/vendor/octicons/svg/file-text.svg","ec523e8cdae2120a7dbce2f364952f55"],["/assets/vendor/octicons/svg/file-zip.svg","96079a3c30c7ba3b0c3c25fc4fcba7bc"],["/assets/vendor/octicons/svg/flame.svg","241b406df0762351f721546658b10733"],["/assets/vendor/octicons/svg/fold.svg","800872454afdfc85a5d790a88e917148"],["/assets/vendor/octicons/svg/gear.svg","d4b171b4106bd9a373d3206b55587541"],["/assets/vendor/octicons/svg/gift.svg","2e05bf0ad35021f196e97ae43b2205aa"],["/assets/vendor/octicons/svg/gist-secret.svg","fbf648c316bb3b2610d3b2ffeb06fceb"],["/assets/vendor/octicons/svg/gist.svg","cd531efa71504ab952f4f34862cffbd5"],["/assets/vendor/octicons/svg/git-branch.svg","5a0c6958476343ed2efaef6ddb682229"],["/assets/vendor/octicons/svg/git-commit.svg","c00e4f3ed106f67369a7269bff2c6546"],["/assets/vendor/octicons/svg/git-compare.svg","20a7b39fc9190739a6edcc4ea92ec763"],["/assets/vendor/octicons/svg/git-merge.svg","0ccbf94fa3025d936e9e171f3987e8cd"],["/assets/vendor/octicons/svg/git-pull-request.svg","886b19375670fc3e85e60a26e9dfc4b2"],["/assets/vendor/octicons/svg/globe.svg","17d14f57fff65b2464d1360bf1a655d5"],["/assets/vendor/octicons/svg/graph.svg","95fdb3dd54cae63e4b1aacf6a32a1e2b"],["/assets/vendor/octicons/svg/heart.svg","00be0064e880fdf94a9dd10e306a82b7"],["/assets/vendor/octicons/svg/history.svg","48032965f226e64eb8f0c41ebc6d077c"],["/assets/vendor/octicons/svg/home.svg","0fa0730d20ed322e1c391907989bafbb"],["/assets/vendor/octicons/svg/horizontal-rule.svg","7d483491d25923068c072c3b318da8fd"],["/assets/vendor/octicons/svg/hubot.svg","49e1e71fddd07ec961c895debd9593e3"],["/assets/vendor/octicons/svg/inbox.svg","fcdfd9643c8f56945685b0958270ab3b"],["/assets/vendor/octicons/svg/info.svg","2d4bec8536d45f8311b05b6bff439b27"],["/assets/vendor/octicons/svg/issue-closed.svg","ddcab31876378756dd58b7e4e7628e8c"],["/assets/vendor/octicons/svg/issue-opened.svg","d075d8042fdfdfe5dafb41cc38d47517"],["/assets/vendor/octicons/svg/issue-reopened.svg","d7014ba5aff2bf1e05fa5e80c77684de"],["/assets/vendor/octicons/svg/jersey.svg","7a74948447ea0a1b608922520fe97b7a"],["/assets/vendor/octicons/svg/key.svg","bdec1b26e851071b9d6ab5ea879c7a2f"],["/assets/vendor/octicons/svg/keyboard.svg","3d53033370cf1b6d883d8f875b8cf4ef"],["/assets/vendor/octicons/svg/law.svg","a7c493ed1d636b3735e3c515e7a4eb75"],["/assets/vendor/octicons/svg/light-bulb.svg","4252b200adf02d1cfa5c517837a4be0a"],["/assets/vendor/octicons/svg/link-external.svg","5fb70be263e3952aa376c22c590bee3c"],["/assets/vendor/octicons/svg/link.svg","52b2cd8d8845755789684edf2d1023b5"],["/assets/vendor/octicons/svg/list-ordered.svg","591fa8e8cf787989ffccd66d851a314b"],["/assets/vendor/octicons/svg/list-unordered.svg","1b44ee1e96932c756abf7bb495fe1cd1"],["/assets/vendor/octicons/svg/location.svg","d093011c7075778a76d84d7f9efdfa18"],["/assets/vendor/octicons/svg/lock.svg","194a9e8190fa91ae3a9ce0668bf58c58"],["/assets/vendor/octicons/svg/logo-github.svg","a64d0f98f6024d7b771845624b3d8500"],["/assets/vendor/octicons/svg/mail-read.svg","1dd4f10d35e9115a571386123a2628f0"],["/assets/vendor/octicons/svg/mail-reply.svg","c9d522d87e61d729a2237c6bacc87567"],["/assets/vendor/octicons/svg/mail.svg","df6fcd28d25a9eedfc3688bcceb4973c"],["/assets/vendor/octicons/svg/mark-github.svg","00bba2c569dff5ba594e48f6567c7c02"],["/assets/vendor/octicons/svg/markdown.svg","d3471ee08edb36a5365e45af9dc3e74f"],["/assets/vendor/octicons/svg/megaphone.svg","c9c674e04b2db17c9374c59b39fd2971"],["/assets/vendor/octicons/svg/mention.svg","e2d8b5a303aa7fdfdf4f6ee6f9b72f0e"],["/assets/vendor/octicons/svg/milestone.svg","0a5ce6116a8ee6dee25303cee25a1efa"],["/assets/vendor/octicons/svg/mirror.svg","6d3ef730df11127795bed4713e0154d8"],["/assets/vendor/octicons/svg/mortar-board.svg","fb90365e4c7f40b08049c0a5a62446f5"],["/assets/vendor/octicons/svg/mute.svg","38c21985408c573c20362934e6fa234d"],["/assets/vendor/octicons/svg/no-newline.svg","7ffe140e04317e95e84242336f7be801"],["/assets/vendor/octicons/svg/octoface.svg","4af9aec684163d2f73401bd3a52470a6"],["/assets/vendor/octicons/svg/organization.svg","0043ccf1acc108f50ee47c019f3c864d"],["/assets/vendor/octicons/svg/package.svg","91383564c76c50ed83181d0d66f918d2"],["/assets/vendor/octicons/svg/paintcan.svg","95996bd27f25da1ae85da752172d7796"],["/assets/vendor/octicons/svg/pencil.svg","e97e3ad54f893dea6119f3dec47176fc"],["/assets/vendor/octicons/svg/person.svg","1dcee911e86132852597cd776cd11765"],["/assets/vendor/octicons/svg/pin.svg","1596c74bfa68a8f278dad96c73006633"],["/assets/vendor/octicons/svg/plug.svg","979781388e88f8276b7fcaddd50f9eab"],["/assets/vendor/octicons/svg/plus.svg","f58001a35e10b94372fb9a69ef7ad99b"],["/assets/vendor/octicons/svg/primitive-dot.svg","86ce7258e6b6e3cd7e23dac7002dc0b7"],["/assets/vendor/octicons/svg/primitive-square.svg","b2c64f724027e98fc3f6a7d46add5409"],["/assets/vendor/octicons/svg/pulse.svg","e6f24928f4abe1c89c73d810dc3bd26e"],["/assets/vendor/octicons/svg/question.svg","c137093665b428548aa447277e3c9e54"],["/assets/vendor/octicons/svg/quote.svg","885f57d491b6fc0771e783d06d6a9449"],["/assets/vendor/octicons/svg/radio-tower.svg","26717ede8eb899c374ec417ed5e26137"],["/assets/vendor/octicons/svg/repo-clone.svg","0f74e9fea83d9edee5fed74420df62eb"],["/assets/vendor/octicons/svg/repo-force-push.svg","fff319d6203a794cd00495a0a72971cc"],["/assets/vendor/octicons/svg/repo-forked.svg","22c02d1cab38f19ec37ba94854971f7c"],["/assets/vendor/octicons/svg/repo-pull.svg","f7e07607e2cd245d941ff5b60b8794c1"],["/assets/vendor/octicons/svg/repo-push.svg","ce3baf50a6c77c5121da62cf76705447"],["/assets/vendor/octicons/svg/repo.svg","1922cdf04c0d5829009ee6b5de298b09"],["/assets/vendor/octicons/svg/rocket.svg","6f84003ab98b9ba09308188cd2046e7a"],["/assets/vendor/octicons/svg/rss.svg","ee5713d56c778d276501ac70bc50c4d1"],["/assets/vendor/octicons/svg/ruby.svg","12eebe93942ce88208e6b733ce5cda62"],["/assets/vendor/octicons/svg/screen-full.svg","4000e1c39097efd1d6cf6b43dda8c246"],["/assets/vendor/octicons/svg/screen-normal.svg","c5d74fda0027b08ad962db6a0cdb995a"],["/assets/vendor/octicons/svg/search.svg","bc184f382d011d68dc1eb2ea12330826"],["/assets/vendor/octicons/svg/server.svg","2b0e4711bd3c65a0d87bcad6d66d2d4b"],["/assets/vendor/octicons/svg/settings.svg","fdfe109c9f799fa626f6d987f171b158"],["/assets/vendor/octicons/svg/shield.svg","c9b58fab3bd6ab4c2fe32f2232a44c56"],["/assets/vendor/octicons/svg/sign-in.svg","2bd55c4d578bd08981e81de29cc46cdb"],["/assets/vendor/octicons/svg/sign-out.svg","5bc42f17d96c4e0d0c857dab047160fd"],["/assets/vendor/octicons/svg/squirrel.svg","028c7f2099272158ad3dcede90c3988f"],["/assets/vendor/octicons/svg/star.svg","8ce11092f8ae04a6aec9fc9f30a221f3"],["/assets/vendor/octicons/svg/stop.svg","4f1d09e4a56e56bc1e657c4823c1a65b"],["/assets/vendor/octicons/svg/sync.svg","9faa51bc96084343884cc9e0f1132933"],["/assets/vendor/octicons/svg/tag.svg","582cebb431a5500b9762a3bf76fffbf6"],["/assets/vendor/octicons/svg/telescope.svg","bd31d6e5d11c474b9aef38942e6cf0ae"],["/assets/vendor/octicons/svg/terminal.svg","60acf258990168a881dbf4c4eb9e7604"],["/assets/vendor/octicons/svg/three-bars.svg","1b277a7e7d9e690f0e97338ca39b3b6d"],["/assets/vendor/octicons/svg/thumbsdown.svg","a4ccb26668d86ea7be2f73bd926296e0"],["/assets/vendor/octicons/svg/thumbsup.svg","b65ab0fa72908f4058831d460d3638bc"],["/assets/vendor/octicons/svg/tools.svg","074cceeae03add1971fb86e0fb17015f"],["/assets/vendor/octicons/svg/trashcan.svg","95b0239dd4dc322f40b44c8d63b94be1"],["/assets/vendor/octicons/svg/triangle-down.svg","f109d23ba3304b7632b1d44df9b1db20"],["/assets/vendor/octicons/svg/triangle-left.svg","938d61e047c36b1a8e0ffb1e82a5faa7"],["/assets/vendor/octicons/svg/triangle-right.svg","e9499a96adfd07704508aec7974cbaf4"],["/assets/vendor/octicons/svg/triangle-up.svg","c11c130f0e5dfcb7c9677a758ea0f64a"],["/assets/vendor/octicons/svg/unfold.svg","e055c77a26d88979f961b3533827ab21"],["/assets/vendor/octicons/svg/unmute.svg","0d6dbd0dc52d55a6bdbfbf79ceec4799"],["/assets/vendor/octicons/svg/versions.svg","c9cd1724140ed8ee7425504463c5e6c1"],["/assets/vendor/octicons/svg/watch.svg","6d3bc896df3a6376b6a92f1de504603b"],["/assets/vendor/octicons/svg/x.svg","b65fa9bffadee7403d020f2013eddc37"],["/assets/vendor/octicons/svg/zap.svg","1d305ae29be6206850128d841259e284"],["/assets/vendor/overtrue-share.js/dist/css/share.min.css","6296ecec29222c9d66e8f24312ecd205"],["/assets/vendor/overtrue-share.js/dist/fonts/iconfont.eot","a373a5121aefc129c462fc36c6f4562e"],["/assets/vendor/overtrue-share.js/dist/fonts/iconfont.svg","80fd24b1e59a36ccfb8758e6ee547122"],["/assets/vendor/overtrue-share.js/dist/fonts/iconfont.ttf","4fd93999c4e43c26b58621b729a27eb0"],["/assets/vendor/overtrue-share.js/dist/fonts/iconfont.woff","b46da715dc8ea8260308a08e20d37fb5"],["/assets/vendor/overtrue-share.js/dist/js/share.min.js","52b6a52359008c74d41eede5408c021c"],["/assets/vendor/primer-css/css/primer.css","4c4a0cf85d76d7d6f958ba8a36f8f7ca"],["/assets/vendor/primer-markdown/dist/user-content.min.css","9f8fe5c288f7a9dfd0130417c66ad42a"],["/assets/vendor/share.js/dist/css/share.min.css","6296ecec29222c9d66e8f24312ecd205"],["/assets/vendor/share.js/dist/fonts/iconfont.eot","a373a5121aefc129c462fc36c6f4562e"],["/assets/vendor/share.js/dist/fonts/iconfont.svg","80fd24b1e59a36ccfb8758e6ee547122"],["/assets/vendor/share.js/dist/fonts/iconfont.ttf","4fd93999c4e43c26b58621b729a27eb0"],["/assets/vendor/share.js/dist/fonts/iconfont.woff","b46da715dc8ea8260308a08e20d37fb5"],["/assets/vendor/share.js/dist/js/jquery.qrcode.min.js","c31ae1b9ebebb5ed4742e6b0f6aaa648"],["/assets/vendor/share.js/dist/js/share.min.js","52b6a52359008c74d41eede5408c021c"],["/categories/index.html","5629e35172d3b40e74f8d94e0628c3df"],["/favicon.ico","5a2645bb0dcb2ae253f7efe2ac004ccd"],["/images/blog/AzureSphereTemplate.png","c647272d4faf46d5f91d34106b0f585c"],["/images/blog/AzureSphereThirdPartySource.jpg","f255771370a0118dc2f7dcd5840a4fee"],["/images/icons/AliPay-200x200.png","ab18d3cb0b7964b77aeda3b01305e6db"],["/images/icons/AliPay-300x300.png","31b54e1f4cbd29baadd4198f28797fd4"],["/images/icons/AliPay-500x500.png","fb17c5a49d62d7246b50e415cf15aaaa"],["/images/icons/WeChat-ThumbUp-200x200.png","f3e6e3b7633c69642516e7576037c0db"],["/images/icons/WeChat-ThumbUp-500x500.png","44611e450c80beab9558524aacbd13a2"],["/images/icons/Wechat-200x200.png","934a81490f8ca4c58cf580c28c04d50c"],["/images/icons/Wechat-300x300.png","c9da6238257a57ca8a74f758465ae61a"],["/images/icons/Wechat-500x500.png","dd7e56825263812cd34f891ade49ffd7"],["/images/icons/clock16.svg","92ae906486098f57a320377c559f578a"],["/images/icons/clock32.svg","926d42cdb6bb3a9ae99e7999b303c8df"],["/images/icons/clock48.svg","79e3a63a456cff65862119f897d1a6ad"],["/images/icons/clock64.svg","2fdeeb13d2f6a3ba6a456f7262321dc1"],["/images/icons/icon-144x144.png","dc6af29e64e134ad8171fc2a945b1380"],["/images/icons/icon-16x16.png","5350441b75b58027bacf774eade879bf"],["/images/icons/icon-32x32.png","104d7736ff4d9c9c7834e8172f8edcc4"],["/images/icons/icon-48x48.png","b25d444660e8749ea8573e82b0b200c5"],["/images/icons/icon-64x64.png","a47f4bf57dbd98798c39e38ce6ba4d96"],["/images/posts/ChromeLoadAgcoreDLL.png","b3a421ee6ab384f5a8ae2447bce094e6"],["/images/posts/ChromeLoadSilverlight.png","f21799d172dad95dbb90203da1b2c1b0"],["/images/posts/DLPHookLoadLibrary.png","bd94f43878df1926cf5a6db414404812"],["/images/posts/audio-windows-10-stack-diagram.png","d76fe6bf9904c95af38b88b6adda6df6"],["/images/visio/objmem.vsd","43f0f2fa420d591c1ca365925d9b079a"],["/links/index.html","4aae2035dd6e688b220d2bf815f9f0f3"],["/manifest.json","25cfb008e24c06d416b1799e560302b6"],["/open-source/index.html","d81dfe1ecca9c21b9c308395d44c4ddf"],["/wiki/index.html","6dea3c9ef3a231d22a25fc2628786c04"]];
var cacheName = 'sw-precache-v3-sw-precache-' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function (originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function (originalResponse) {
    // If this is not a redirected response, then we don't have to do anything.
    if (!originalResponse.redirected) {
      return Promise.resolve(originalResponse);
    }

    // Firefox 50 and below doesn't support the Response.body stream, so we may
    // need to read the entire body to memory as a Blob.
    var bodyPromise = 'body' in originalResponse ?
      Promise.resolve(originalResponse.body) :
      originalResponse.blob();

    return bodyPromise.then(function(body) {
      // new Response() is happy when passed either a stream or a Blob.
      return new Response(body, {
        headers: originalResponse.headers,
        status: originalResponse.status,
        statusText: originalResponse.statusText
      });
    });
  };

var createCacheKey = function (originalUrl, paramName, paramValue,
                           dontCacheBustUrlsMatching) {
    // Create a new URL object to avoid modifying originalUrl.
    var url = new URL(originalUrl);

    // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
    // then add in the extra cache-busting URL parameter.
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
      url.search += (url.search ? '&' : '') +
        encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
  };

var isPathWhitelisted = function (whitelist, absoluteUrlString) {
    // If the whitelist is empty, then consider all URLs to be whitelisted.
    if (whitelist.length === 0) {
      return true;
    }

    // Otherwise compare each path regex to the path of the URL passed in.
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function(whitelistedPathRegex) {
      return path.match(whitelistedPathRegex);
    });
  };

var stripIgnoredUrlParameters = function (originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function(item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, false);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function(requests) {
    return requests.map(function(request) {
      return request.url;
    });
  }).then(function(urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return setOfCachedUrls(cache).then(function(cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, {credentials: 'same-origin'});
              return fetch(request).then(function(response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function(responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function() {
      
      // Force the SW to transition from installing -> active state
      return self.skipWaiting();
      
    })
  );
});

self.addEventListener('activate', function(event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.keys().then(function(existingRequests) {
        return Promise.all(
          existingRequests.map(function(existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function() {
      
      return self.clients.claim();
      
    })
  );
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = 'index.html';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '';
    if (!shouldRespond &&
        navigateFallback &&
        (event.request.mode === 'navigate') &&
        isPathWhitelisted([], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function(e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});







