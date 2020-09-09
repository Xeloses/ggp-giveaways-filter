// ==UserScript==
// @name         GGPlayers: Giveaway list filter
// @description  Add filters to giveaway list, allow to hide ended and joined giveaways.
// @author       Xeloses
// @version      1.0
// @license      MIT
// @namespace    Xeloses.GGPlayers.GiveawayListFilter
// @updateURL    https://github.com/Xeloses/ggp-giveaways-filter/raw/master/ggp-giveaways-filter.user.js
// @downloadURL  https://github.com/Xeloses/ggp-giveaways-filter/raw/master/ggp-giveaways-filter.user.js
// @match        https://ggplayers.com/giveaways/*
// @grant        none
// @noframes
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    /* globals jQuery */

    // jQuery:
    const $J = (typeof jQuery !== 'undefined')?jQuery:null;

    // Giveaway list:
    let $GAs = null;

    // Filter form:
    let $frm = null;

    // Enable/disable status & error output to console:
    const ENABLE_CONSOLE_OUTPUT = true;

    // Console message types:
    const LOG_INFO = 1;
    const LOG_WARN = 2;
    const LOG_ERROR = 3;

    String.prototype.replaceAll = function(search,replacement)
    {
        return this.split(search).join(replacement);
    };

    /*
     * Output message to console.
     *
     * @param string   msg   // Message
     * @param int|null level // Log level (LOG_INFO, LOG_WARN or LOG_ERROR)
     *
     * @return void
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
     * Add form to page.
     */
    function renderForm()
    {
        // create and insert form into page:
        const cb_template = '<div class="bp-checkbox-wrap" style="display:inline-block;margin:0 5px;"><input type="checkbox" class="bs-styled-checkbox" name="ga_list_filter_{ITEM}" id="ga_list_filter_{ITEM}" /><label for="ga_list_filter_{ITEM}">Hide {ITEM}</label></div>';

        $frm = $J('<form class="standard-form" style="display:inline-block;margin:0 5px;float:right;"><p class="form-row" style="margin:2px;"></p></form>')

        //$J('main#main>p:first').append($frm);
        $frm.insertAfter($J('#content .woocommerce-result-count'));
        $frm.find('p').first().append(
            $J(cb_template.replaceAll('{ITEM}','joined')),
            $J(cb_template.replaceAll('{ITEM}','ended'))
        );

        // add event listeners:
        $frm.find('input[type="checkbox"]').on('change',filterList);
        //$frm.on('change',filterList);
    }

    /*
     * Filter giveaway list.
     */
    function filterList()
    {
        const filterJoined = $frm.find('input#ga_list_filter_joined').prop('checked'),
              filterEnded = $frm.find('input#ga_list_filter_ended').prop('checked');

        let $item = null;

        $GAs.each((i,item) => {
            $item = $J(item);
            $item.css(
                'display',
                ((filterEnded && !$item.hasClass('purchasable')) || (filterJoined && $item.find('a:last').text().trim().toLowerCase() == 'joined')) ? 'none' : 'list-item'
            );
        });
    }

    // check URL:
    if(/^https:\/\/ggplayers.com\/giveaways[\/]?(\?.*)?$/i.test(window.location.href))
    {
        // check jQuery:
        if(!$J || typeof $J !== 'function'){
            return;
        }

        $GAs = $J('ul.products>li');

        renderForm();
        $log('App loaded.');
    }
})();