// ==UserScript==
// @name         XXGGP: Xeloses` eXtended GGPlayers
// @description  Improvements and extensions for GGPlayers (giveaways list filters, GGPoins display, Steam links for giveaways, layout fxes and UI improvements).
// @author       Xeloses
// @version      1.0.4
// @license      GPL-3.0 (https://www.gnu.org/licenses/gpl-3.0.html)
// @namespace    Xeloses.XXGGP
// @website      https://github.com/Xeloses/xxggp
// @downloadURL  https://github.com/Xeloses/xxggp/raw/master/xxggp.user.js
// @updateURL    https://github.com/Xeloses/xxggp/raw/master/xxggp.user.js
// @match        https://ggplayers.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @connect      ggplayers.com
// @noframes
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    /* globals jQuery */

    /*
     * @const jQuery object
     */
    const $J = (typeof jQuery !== 'undefined') ? jQuery : ((typeof $ !== 'undefined') ? $ : null);
    if(!$J || typeof $J !== 'function') return;

    /*
     * Current website category and section
     */
    let category = 'default',
        section = 'default';

    /*
     * @var Giveaway list
     */
    let $GAs = null;

    /*
     * @var Filters form
     */
    let $frm = null;

    /*
     * Extend JS String.
     */
    String.prototype.replaceAll = function(search,replacement)
    {
        return this.split(search).join(replacement);
    };

    String.prototype.encodeTerm = function()
    {
        return encodeURIComponent(this).replaceAll('%20','+');
    };

    String.prototype.escapeQuot = function()
    {
        return this.replace('/\"/g','&quot;');
    };

    /*
     * Log
     */
    // init Log:
    class XelLog{constructor(){let sData=GM_info.script;this.a=sData.author;this.n=sData.name.replace(':','');this.ns=sData.namespace;this.v=sData.version;this.app=this.a+'` '+this.n;this.h='color:#c5c;font-weight:bold;';this.t='color:#ddd;font-weight:normal;';}log(s){console.log('%c['+this.app+']%c '+s,this.h,this.t)}info(s){console.info('%c['+this.app+']%c '+s,this.h,this.t+'font-style:italic;')}warn(s){console.warn('%c['+this.app+']%c '+s,this.h,this.t)}error(s){console.error('%c['+this.app+']%c '+s,this.h,this.t)}}
    const $log = new XelLog();

    /*
     * Filter giveaways list.
     *
     * @return {void}
     */
    function filterGiveawaysList()
    {
        const filterJoined = $frm.find('input#ga_list_filter_joined').prop('checked'),
              filterClosed = $frm.find('input#ga_list_filter_closed').prop('checked');

        let $item = null;

        $GAs.each((i,item) => {
            $item = $J(item);
            $item.css(
                'display',
                ((filterClosed && !$item.hasClass('purchasable')) || (filterJoined && $item.find('a[data-product_id]').text().trim().toLowerCase() == 'joined')) ? 'none' : 'list-item'
            );
        });
    }

    /*
     * Add filters form to Giveaways page.
     *
     * @return {void}
     */
    function renderGiveawaysFilterForm()
    {
        // create and insert form into page:
        const cb_template = '<input type="checkbox" name="ga_list_filter_{ITEM}" id="ga_list_filter_{ITEM}" /><label for="ga_list_filter_{ITEM}">Hide {ITEM}</label>';

        $frm = $J('<form class="ggp-ga-filters"></form>').appendTo($J('#content header:first-of-type')).append(
            $J(cb_template.replaceAll('{ITEM}','joined')),
            $J(cb_template.replaceAll('{ITEM}','closed'))
        );

        // add event listeners:
        $frm.find('input[type="checkbox"]').on('change',filterGiveawaysList);
        $frm.find('label').on('click',function(){ $J(this).toggleClass('checked'); });

    }

    /*
     * Add Steam link to giveaways.
     *
     * @return {void}
     */
    function addSteamLink()
    {
        const steam_link = '<a href="https://store.steampowered.com/search/?term=%TERM%" target="_blank" class="button steam-link" aria-label="Search “%NAME%” on Steam" title="Search “%NAME%” on Steam" rel="nofollow"><img src="https://store.cloudflare.steamstatic.com/public/shared/images/responsive/share_steam_logo.png" alt="Steam" /></a>';

        let $item = null,
            name = '';

        $GAs.each((i,item) => {
            $item = $J(item);

            // get giveaway name:
            name = $item.find('h2').first().text();

            // check giveaway is not "Steam gift card":
            if(name && !name.match(/steam gift card/i))
            {
                // get game name:
                name = name.replace(/(steam|key|giveaway|\s^)/gi,'').trim();
                // create & render button:
                $J(steam_link.replace('%TERM%',name.encodeTerm()).replaceAll('%NAME%',name.escapeQuot())).insertAfter($item.find('a.button[data-product_id]'));
            }
        });
    }

    /*
     * Add GGPoints display to page.
     *
     * @return {void}
     */
    function renderGGPointsDisplay()
    {
        // get xmlHTTPrequest object:
        const $xhr = (typeof GM.xmlHttpRequest !== 'undefined') ? GM.xmlHttpRequest : ((typeof GM_xmlhttpRequest !== 'undefined') ? GM_xmlhttpRequest : null);
        if(!$xhr) return;

        // get user profile url:
        const profile_url = $J('header #main-nav-menu .bp-profile-nav>a').first().attr('href');
        if(!profile_url) return;

        // create and insert GGPoints display container into page:
        const $ggp_display = $J('<p class="ggp-points"><img />GGPoints: <span></span></p>').insertAfter('#content .woocommerce-result-count');

        // set image:
        $ggp_display.find('img').attr('src', $J('header #logo img:first-of-type').attr('src'));

        // query GGPoints count from profile page:
        $xhr({
            method: 'GET',
            url: profile_url,
            onload:function(response){
                // check response status:
                if(response.status && response.status == 200){
                    // check response data:
                    if(response.response && response.response.length){
                        let ggpoints = $J(response.response).find('.gamipress-buddypress-user-points').text().trim();
                        if(!Number.isNaN(ggpoints)){
                            ggpoints = Number.parseInt(ggpoints);
                            $ggp_display.find('span').css('color', (ggpoints < 650) ? '#f55' : ((ggpoints < 1250) ? '#f99' : 'inherit')).text(ggpoints);
                            $ggp_display.css('display','block');
                        }
                    }else{
                        $log.error('Error: could not query user profile.');
                    }
                }else{
                    $log.error('Error' + (response.status?'('+response.status+')':'') + ': could not retrieve data from ggplayers.com');
                }
            },
            onerror:function(response){
                $log.error('Error: request error.');
            }
        });
    }

    /*
     * Fix layout.
     *
     * @return {void}
     */
    function fixLayout()
    {
        let el = null,
            s = '';

        switch(category)
        {
            /* GIVEAWAYS LIST */
            case 'giveaways':
                //check page is GA list or single GA:
                el = $J('form:has(button[name="add-to-cart"])');
                if(el && el.length)
                {
                    // Single GA -> remove "Participate" form if ticket already bought:
                    if(el && el.length && el.find('input[name="quantity"]').prop('type').toLowerCase() != 'hidden')
                    {
                        el.remove();
                    }
                }
                else
                {
                    // GA list -> remove unnecesarry classes:
                    $J('ul.products > li').each((i,item)=>{
                        $J(item).removeClass('first last');
                    });
                }
                break;
            /* PURCHASE CHECKOUT */
            case 'checkout':
                $J('#payment #terms').prop('checked',true);
                break;
            /* FORUM & GROUPS */
            case 'groups':
            case 'forums':
                // upgrade "Leave group" button:
                el = $J('#item-header > .groups-meta.action:has(button)');
                if(el && el.length)
                {
                    s = el.find('button.leave-group').attr('data-bp-nonce');
                    if(s && s.length)
                    {
                        $J('#object-nav > ul').append($J('<li id="leave-groups-li" class="bp-groups-tab"><a href="' + s + '" id="leave">Leave</a></li>'))
                        el.remove();
                    }
                }

                // upgrade "Last update" block:
                $J('<p class="activity-title">Last update:</p>').insertBefore($J('#item-header > #item-header-content > .activity'));

                // move admins/moderators list to the botom of the header:
                $J('#item-header').append($J('#item-header > #item-actions').detach());
                break;
            /* MEMBERS */
            case 'members':
                if(section != 'default')
                {
                    /* MEMBER'S PROFILE */

                    // get profile header block:
                    let $el = $J('#item-header-content');
                    if($el && $el.length)
                    {
                        // move membership and last activity blocks under username:
                        $el.children('.gamipress-buddypress-achievements').detach().insertAfter($el.children('.user-nicename'));
                        $el.children('.item-meta').detach().insertAfter($el.children('.gamipress-buddypress-achievements'));

                        // swap rank and gg-poins display:
                        $el.children('.gamipress-buddypress-points').detach().insertAfter($el.children('.gamipress-buddypress-ranks'));

                        // add icons to action buttons:
                        $el.find('.member-header-actions .generic-button > button, .member-header-actions .generic-button > a').each(function(){
                            let $this = $J(this);
                            $this.html((i,s)=>{
                                if($this.hasClass('friendship-button'))   return (($this.attr('rel').toLowerCase() == 'add') ? '<span class="dashicons dashicons-plus-alt2"></span>' : '<span class="dashicons dashicons-no-alt"></span>') + s; // "Add/Remove friend" button
                                if($this.hasClass('mention'))             return '<span class="dashicons dashicons-testimonial"></span>' + s;    // "Public Message" button
                                if($this.hasClass('send-message'))        return '<span class="dashicons dashicons-admin-comments"></span>' + s; // "Private Message" button
                                if($this.hasClass('bpmts-report-button')) return '<span class="dashicons dashicons-flag"></span>' + s;           // "Report" button
                            })
                        });

                        // move settings button to the end of the buttons row:
                        $el = $J('#object-nav ul');
                        $el.find('#settings-personal-li').detach().appendTo($el);
                    }
                }
                break;
        }

        // fix "Login" link:
        el = $J('.bp-login-nav a');
        if(el && el.length && el.attr('href') && !el.attr('href').startsWith('https://ggplayers.com/login'))
        {
            el.attr('href', 'https://ggplayers.com/login/?redirect_to=' + encodeURIComponent(window.location.href));
        }
    }

    /*
     * Add custom CSS styles to page.
     *
     * @return {void}
     */
    function injectCSS()
    {
        let css = '',
            c = $J('body').css('color');

        switch(category)
        {
            /* GIVEAWAYS */
            case 'giveaways':
                css = '#content header>h1 {display:inline-block;}\n'+
                      '.ggp-ga-filters {display:inline-block;margin:5px 10px 0;float:right;}\n'+
                      '.ggp-ga-filters input {display:none;}\n'+
                      '.ggp-ga-filters label {display:block;margin:0 5px;font-size:16px;line-height:20px !important;overflow:hidden;cursor:pointer;}\n'+
                      '.ggp-ga-filters label:hover {color:#f98d00;}\n'+
                      '.ggp-ga-filters label::before {content:"\\f159";display:inline-block;position:relative;left:0px;top:3px;margin:0 3px;font-family:dashicons;font-size:18px;text-decoration:none;text-transform:none;text-rendering:auto;speak:none;}\n'+
                      '.ggp-ga-filters label.checked::before {content:"\\f12a";}\n'+
                      '.ggp-points {display:none;float:right;margin:0 15px;line-height:35px;font-size:15px;}\n'+
                      '.ggp-points>span {font-weight:bold;}\n'+
                      '.ggp-points>img {max-height:20px !important;width:auto;margin:0 5px;position:relative;top:5px;}\n'+
                      '#content .products .product {text-align:center;clear:none !important;}\n'+
                      '#content .products .product h2 {margin:0 10% 10px;width:80%;}\n'+
                      '#content .products .product .product-img {background:transparent !important;}\n'+
                      '#content .products .product .steam-link {margin-left:3px;padding:8px 8px 7px;height:35px;}\n'+
                      '#content .products .product .steam-link>img {height:20px;width:auto;margin:0;filter:invert(1);}\n'+
                      '#content .product>.summary>form.cart {border:none;margin:0px;padding:0px;}\n'+
                      '#content .product>.summary>.product_meta {border-top:1px ridge;margin-top:15px;padding-top:10px;}\n'+
                      '@media only screen and (min-width: 992px) {#content .products .product {width:23% !important;margin:0 1% 30px !important;}}\n'+
                      '@media only screen and (max-width: 992px) and (min-width: 670px) {#content .products .product {width:31% !important;margin:0 1.1% 30px !important;}}\n'+
                      '@media only screen and (max-width: 670px) {#content .products .product {width:47% !important;margin:0 1.5% 30px !important;}}\n';
                break;
            /* PURCHASE CHECKOUT */
            case 'checkout':
                css = '#payment .place-order {padding:0 1.4em 1.4em;}\n'+
                      '#payment div.form-row p.form-row {margin-top:10px;}\n'+
                      '#payment #place_order {width:200px;margin-top:15px;margin-left:calc(100% / 2 - 100px);white-space:nowrap;}\n';
                break;
            /* FORUM & GROUPS */
            case 'groups':
            case 'forums':
                css = '.bp-dir-hori-nav:not(.bp-vertical-navs) .main-navs:not(.dir-navs) #leave:before {content:"\\f08b";}\n'+
                      '.groups-header .group-item-actions {margin-bottom:0;}\n'+
                      '#buddypress #item-header-content p.highlight {display:block;font-size:22px;}\n'+
                      '#buddypress #item-header-content p.activity-title {color: rgba(255,255,255,0.8);margin:5px;}\n'+
                      '#buddypress #item-header-avatar img {margin: 20px;}\n'+
                      '#buddypress #item-header ul {margin:5px 0;}\n'+
                      '#buddypress #item-actions {margin:15px 0 5px;padding:10px 0 0;border-top:1px solid #3d3f42;}\n'+
                      '#buddypress #item-actions dl {display:inline-block;width:30%;}\n';
                break;
            /* MEMBERS */
            case 'members':
                if(section != 'default')
                {
                    /* MEMBER'S PROFILE */
                    css = '#buddypress #item-header-avatar a>img{margin:15px 0 5px;}\n'+
                          '#buddypress #item-header-content{margin-bottom: 10px;}\n'+
                          '#buddypress #item-header-content .gamipress-buddypress-achievements{color:'+c+';font-size:14px;font-weight:bold;}\n'+
                          '#buddypress #item-header-content .item-meta{color:'+c+';font-style:italic;margin-bottom:5px;}\n'+
                          '#buddypress #item-header-content .gamipress-buddypress-ranks, #buddypress #item-header-content .gamipress-buddypress-points{display:inline-block;width:170px;margin:0 70px;overflow:visible;white-space:nowrap;}\n'+
                          '#buddypress #item-header-content .gamipress-buddypress-ranks span, #buddypress #item-header-content .gamipress-buddypress-points span{display:inline-block;}\n'+
                          '#buddypress #item-header-content .gamipress-buddypress-ranks span:first-child, #buddypress #item-header-content .gamipress-buddypress-points span:first-child{float:left;height:75px;}\n'+
                          '#buddypress #item-header-content .gamipress-buddypress-ranks span:not(:first-child), #buddypress #item-header-content .gamipress-buddypress-points span:not(:first-child){margin-top:25px;}\n'+
                          '#buddypress #item-header-content .gamipress-buddypress-user-points{font-weight:bold;}\n'+
                          '#buddypress #item-header-content .member-header-actions .generic-button{margin:0 5px;}\n'+
                          '#buddypress #item-header-content .member-header-actions .generic-button>button, #buddypress #item-header-content .member-header-actions .generic-button>a{display:block;margin:10px 0;padding:0 10px;line-height:25px;background:#2c2f34;color:#ffffff;border:1px solid #333;border-radius:2px;}\n'+
                          '#buddypress #item-header-content .member-header-actions .generic-button>button:hover, #buddypress #item-header-content .member-header-actions .generic-button>a:hover{background-color:#f98d00;color:#FFFFFF;border-radius:5px;}\n'+
                          '#buddypress #item-header-content .member-header-actions .generic-button .dashicons{display:inline-block;margin:3px 5px 2px 0;}\n';
                }
                break;
        }

        // fixes for comments & replies:
        css += '#activity-stream .activity-content .activity-meta.action .generic-button > a.button {color:#f98d00;opacity:0.6;transition:0.3s;}\n'+
               '#activity-stream .activity-content .activity-meta.action .generic-button > a.button:hover {opacity:1;}\n'+
               '#activity-stream .activity-content .activity-meta.action .generic-button > a.button.delete-activity:hover {color: #e33;}\n'+
               '#activity-stream .activity-content .activity-meta.action .generic-button > a.button.bpmts-activity-report-button:hover {color:#e53;}\n'+
               '#activity-stream .comment-item .activity-meta.action .generic-button > a {margin-right: 2px;}\n'+
               '.activity-list .activity-item .activity-meta.action .button span {color:inherit;}\n';

        // fix for widgets (aside blocks):
        css += '#content .sidebar .widget .widget-title:before {background-color:rgba(30,30,30,0.9);border:solid 1px #1a1a1a;border-radius:3px;}\n'+
               '#content .sidebar .widget .item-options a {margin-right:3px;border-radius:3px;}\n'+
               '#content .sidebar .widget .item-options a:not(.selected) {background-color:rgba(70,70,70,0.4);}\n'+
               '#content .sidebar .widget .item-options a:not(.selected):hover {background-color:rgba(70,70,70,0.7);}\n';

        // inject CSS:
        $J('<style>').prop('type','text/css').html(css).appendTo('head');
    }

    // check URL:
    let url = new URL(window.location.href.toLowerCase());
    if(url.hostname == 'ggplayers.com')
    {
        // get page category and section:
        if(url.pathname && url.pathname != '/')
        {
            let path = url.pathname.split('/').filter((s)=>{ return s.length; });
            if(path.length) [category,section] = [path.shift(), path.length ? path.join('/') : section];
        }

        // add CSS:
        injectCSS();

        // fix layout:
        fixLayout();

        // add giveaways filter form:
        if(category == 'giveaways' && section == 'default')
        {
            // get giveaways list:
            $GAs = $J('ul.products > li');

            if($GAs && $GAs.length)
            {
                // add steam links to giveaways:
                addSteamLink();

                // check user has logged in:
                if($J('header #main-nav-menu .bp-login-nav').length || $J('header #main-nav-menu .bp-register-nav').length) return;

                // add filter controls:
                renderGiveawaysFilterForm();

                // add GGPoints display:
                renderGGPointsDisplay();
            }
        }

        $log.log('App loaded (category: "' + category + '"' + ((section != 'default') ? '; section: "' + section + '"' : '') + ').');
    }
})();