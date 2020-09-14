// ==UserScript==
// @name         GGPlayers: Giveaway list filter
// @description  Add filters to giveaway list, allow to hide ended and joined giveaways.
// @author       Xeloses
// @version      1.0.1
// @license      MIT
// @namespace    Xeloses.GGPlayers.GiveawayListFilter
// @updateURL    https://github.com/Xeloses/ggp-giveaways-filter/raw/master/ggp-giveaways-filter.user.js
// @downloadURL  https://github.com/Xeloses/ggp-giveaways-filter/raw/master/ggp-giveaways-filter.user.js
// @match        https://ggplayers.com/giveaways/*
// @grant        GM.xmlhttpRequest
// @grant        GM_xmlhttpRequest
// @connect      ggplayers.com
// @noframes
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    /* globals jQuery */

    // @const jQuery object
    const $J = (typeof jQuery !== 'undefined')?jQuery:null;

    // @const xmlHTTPrequest object
    const $xhr = (typeof GM.xmlhttpRequest !== 'undefined') ? GM.xmlhttpRequest : ((typeof GM_xmlhttpRequest !== 'undefined') ? GM_xmlhttpRequest : null);

    // @const Enable/disable status & error output to console
    const ENABLE_CONSOLE_OUTPUT = true;

    // @const Console message types
    const LOG_INFO = 1;
    const LOG_WARN = 2;
    const LOG_ERROR = 3;

    // @var Giveaway list
    let $GAs = null;

    // @var Filters form
    let $frm = null;

    String.prototype.replaceAll = function(search,replacement)
    {
        return this.split(search).join(replacement);
    };

    /*
     * Output message to console.
     *
     * @param {string} msg    // Message
     * @param {int}    level  // Log level: LOG_INFO or LOG_WARN or LOG_ERROR
     *
     * @return {void}
     */
    function $log(msg,level=null)
    {
        if(!ENABLE_CONSOLE_OUTPUT||!msg){return;}

        let t = '%c[Xeloses` GGPlayers giveaway list filter]%c '+msg,
            hStyle = 'color:#c5c;font-weight:bold;',
            tStyle = 'color:#ddd;font-weight:normal;';

        switch(level){
            case LOG_INFO:
                console.info(t,hStyle,tStyle+'font-style:italic;');break;
            case LOG_WARN:
                console.warn(t,hStyle,tStyle);break;
            case LOG_ERROR:
                console.error(t,hStyle,tStyle);break;
            default:
                console.log(t,hStyle,tStyle);break;
        }
    }

    /*
     * Filter giveaway list.
     *
     * @return {void}
     */
    function filterList()
    {
        const filterJoined = $frm.find('input#ga_list_filter_joined').prop('checked'),
              filterClosed = $frm.find('input#ga_list_filter_closed').prop('checked');

        let $item = null;

        $GAs.each((i,item) => {
            $item = $J(item);
            $item.css(
                'display',
                ((filterClosed && !$item.hasClass('purchasable')) || (filterJoined && $item.find('a:last').text().trim().toLowerCase() == 'joined')) ? 'none' : 'list-item'
            );
        });
    }

    /*
     * Add form to page.
     *
     * @return {void}
     */
    function renderForm()
    {
        // create and insert form into page:
        const cb_template = '<input type="checkbox" name="ga_list_filter_{ITEM}" id="ga_list_filter_{ITEM}" /><label for="ga_list_filter_{ITEM}">Hide {ITEM}</label>';

        $frm = $J('<form class="ggp-ga-filters"></form>').appendTo($J('#content header:first-of-type')).append(
            $J(cb_template.replaceAll('{ITEM}','joined')),
            $J(cb_template.replaceAll('{ITEM}','closed'))
        );

        // add event listeners:
        $frm.find('input[type="checkbox"]').on('change',filterList);
        $frm.find('label').on('click',function(){ $J(this).toggleClass('checked'); });

    }

    /*
     * Add form to page.
     *
     * @return {void}
     */
    function renderGGPointsDisplay()
    {
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
                        $log('Error: could not query user profile.',LOG_ERROR);
                    }
                }else{
                    $log('Error' + (response.status?'('+response.status+')':'') + ': could not retrieve data from ggplayers.com',LOG_ERROR);
                }
            },
            onerror:function(response){
                $log('Error: request error.',LOG_ERROR);
            }
        });
    }

    /*
     * Add custom CSS styles to page.
     *
     * @return {void}
     */
    function injectCSS()
    {
        $J('<style>').prop('type','text/css').html(
            '#content header>h1 {display: inline-block;}\n'+
            '.ggp-ga-filters {display: inline-block;margin: 5px 10px 0;float: right;}\n'+
            '.ggp-ga-filters input {display: none;}\n'+
            '.ggp-ga-filters label {display: block;margin: 0 5px;font-size: 16px;line-height: 20px !important;overflow: hidden;cursor: pointer;}\n'+
            '.ggp-ga-filters label:hover {color: #f98d00;}\n'+
            '.ggp-ga-filters label::before {content: "\\f159";display: inline-block;position: relative;left: 0px;top: 3px;margin: 0 3px;font-family: dashicons;font-size: 18px;text-decoration: none;text-transform: none;text-rendering: auto;speak: none;}\n'+
            '.ggp-ga-filters label.checked::before {content: "\\f12a";}\n'+
            '.ggp-points {display: none;float: right;margin: 0 15px;line-height: 35px;font-size: 15px;}\n'+
            '.ggp-points>span {font-weight: bold;}\n'+
            '.ggp-points>img {max-height: 20px !important;width: auto;margin: 0 5px;position: relative;top: 5px;}\n'+
            '#content .products .product {text-align: center;clear: none !important;}\n'+
            '#content .products .product h2 {margin: 0 10% 10px;width: 80%;}\n'+
            '#content .products .product .product-img {background: transparent !important;}\n'+
            '@media only screen and (min-width: 992px) {#content .products .product {width: 23% !important;margin: 0 1% 30px !important;}}\n'+
            '@media only screen and (max-width: 992px) and (min-width: 670px) {#content .products .product {width: 31% !important;margin: 0 1.1% 30px !important;}}\n'+
            '@media only screen and (max-width: 670px) {#content .products .product {width: 47% !important;margin: 0 1.5% 30px !important;}}\n'
        ).appendTo('head');
    }

    // check URL:
    if(/^https:\/\/ggplayers.com\/giveaways[\/]?(\?.*)?$/i.test(window.location.href))
    {
        // check jQuery:
        if(!$J || typeof $J !== 'function') return;

        // add CSS:
        injectCSS();

        // get giveaways list:
        $GAs = $J('ul.products>li').each((i,item)=>{
              $J(item).removeClass('first last');
        });

        // check user has logged in:
        if($J('header #main-nav-menu .bp-login-nav').length || $J('header #main-nav-menu .bp-register-nav').length) return;

        // add filter controls:
        renderForm();

        // add GGPoints display:
        renderGGPointsDisplay();

        $log('App loaded.');
    }
})();