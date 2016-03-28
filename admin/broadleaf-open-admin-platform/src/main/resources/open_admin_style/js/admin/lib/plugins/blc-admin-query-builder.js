/*
 * #%L
 * BroadleafCommerce Open Admin Platform
 * %%
 * Copyright (C) 2009 - 2015 Broadleaf Commerce
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *       http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
/**
 * A BLC Admin plugin for the jQuery Query Builder
 * that customizes the component to handle complex rules containing an item quantity
 * as well as simple rules while augmenting the default styles to support
 * Admin UX concepts and styles
 * @author Elbert Bautista (elbertbautista)
 */

$.fn.queryBuilder.define('blc-admin-query-builder', function(options) {

    /**
     * Custom callback to handle the custom group condition radio buttons (ALL/ANY)
     * - called after the group condition has been updated
     */
    this.on('afterUpdateGroupCondition.filter', function(h, group) {
        group.$el.find('>.rules-group-header [name$=_cond]').each(function() {
            var $this = $(this);
            $this.toggleClass('checked', $this.val() === group.condition);
        });
    });

    /**
     * Custom callback to handle displaying rules with multiple value fields
     * (e.g. Order Item - Quantity in between [text] , [text])
     */
    this.on('afterCreateRuleInput.filter', function(h, rule) {
        var numElements = rule.$el.find('.rule-value-container span.rule-val-sep').length + 1;
        if (numElements > 1) {
            var dynamicWidth = 205/numElements;
            rule.$el.find('.rule-value-container span.rule-val-sep').parent()
                .find('input').each(function() {
                    var $this = $(this);
                    $this.wrap("<div style='display:inline-block;width:" + dynamicWidth + "px;'></div>");
            });
        }
        rule.$el.append('<div style="clear: both"></div>')

    });


    this.on('afterCreateRuleFilters.filter', function(h, rule) {
        rule.$el.append('<div style="clear: both"></div>');

        styleInputs(rule);
    });

    this.on('afterCreateRuleOperators.filter', function(h, rule) {
        rule.$el.append('<div style="clear: both"></div>');

        styleInputs(rule);
    });

    this.on('afterUpdateRuleFilter.filter', function(h, rule) {
        styleInputs(rule);
    });

    this.on('afterUpdateRuleOperator.filter', function(h, rule) {
        styleInputs(rule);
    });

    /**
     * Modify Default Templates
     */
    this.on('getGroupTemplate.filter', function(h, level) {
        if (level===1) {
            var $h = $(h.value);
            //Strip-out default Bootstrap styles
            $h.find('.btn-group, .btn, .btn-xs, .btn-success, .btn-primary').each(function(){
                $(this).removeClass('btn-group btn btn-xs btn-success btn-primary');
            });

            //Add a remove condition button - only for
            //org.broadleafcommerce.common.presentation.client.SupportedFieldType.RULE_WITH_QUANTITY
            if (options.removeConditionsLink) {
                $h.find('.group-actions').each(function(){
                    $(this).append(options.removeConditionsLink);
                });
            }

            //Pre-Style the All/Any Toggle Switch Radio Buttons
            $h.find('.group-conditions label').each(function(index){
                var inputName = $(this).find('input[type="radio"]').attr('name');
                inputName += '--' + index;
                $(this).find('input[type="radio"]').attr('id', inputName);
                $(this).attr('for', inputName);
            });

            $h.find('.group-conditions')
                .wrapInner("<div class='query-builder-all-any-wrapper'><div class='toggle-container'></div></div>");

            $h.find('.group-conditions > .query-builder-all-any-wrapper > .toggle-container ' +
                    '> label > input[type="radio"]').each(function(){
                $(this).addClass('toggle');
                $(this).insertBefore($(this).parent());
            });

            $h.find('.group-conditions > .query-builder-all-any-wrapper input[type="radio"].toggle:checked').addClass('checked');

            //TODO i18n the text
            //Add the Match instructions with quantity field if necessary
            var matchSpan = $("<span>", {"class": "rules-group-header-span", "text": "Match"});
            var itemPK = $("<input>", {"class": "rules-group-header-item-pk", "type": "hidden", "value": options.pk});
            var itemQty = $("<input>", {"class": "rules-group-header-item-qty", "type": options.quantity ? "text" : "hidden",
                "value": options.quantity});

            // To introduce additional unique "items that satisfy" text, you must create a property such that
            // the key is in the following format "{Rule Identifier Type}_ItemsThatSatisfyText".
            // Examples: "PRODUCT_FIELDS_ItemsThatSatisfyText" or "ORDER_ITEM_FIELDS_ItemsThatSatisfyText"
            var satisfyText = $(this).closest('.query-builder-rules-container').data('itemsthatsatisfytext');
            if (typeof satisfyText === 'undefined' || satisfyText === null || satisfyText.endsWith("_ItemsThatSatisfyText")) {
                // If the property cannot be resolved, use the default text.
                satisfyText = "items that satisfy";
            }

            var satisfySpan = $("<span>", {"class": "rules-group-header-span", "text": satisfyText});
            var followingRulesSpan = $("<span>", {"class": "rules-group-header-span", "text": "of the following:"});
            $h.find('.group-conditions').prepend(satisfySpan).prepend(itemQty).prepend(itemPK).prepend(matchSpan).append(followingRulesSpan);
            $h.find('.group-actions button').addClass('button');
            h.value = $h.prop('outerHTML');
        }
    });

    this.on('getRuleTemplate.filter', function(h, level) {
        var $h = $(h.value);
        //Strip out Bootstrap styles
        $h.find('.btn-group, .btn, .btn-xs, .btn-success, .btn-primary, .btn-danger').each(function(){
            $(this).removeClass('btn-group btn btn-xs btn-success btn-primary btn-danger');
        });

        $h.find('button').each(function(){
            $(this).addClass('remove-row');
            $(this).contents().filter(function(){return this.nodeType === 3;}).remove();
        });

        h.value = $h.prop('outerHTML');
    });

    function styleInputs(rule) {
        var el = rule.$el;
        //el.find('div.rule-filter-container > div > div.selectize-input').width("222px");
        //el.find('div.rule-operator-container > div > div.selectize-input').width("100px");
        //el.find('div.rule-value-container > div > div.selectize-input').width("223px");
        //el.find('div.rule-value-container').css("display", "inline-block");

        //modify the built in radio styles
        el.find('label > input[type="radio"]').each(function(){
            $(this).parent().addClass('rule-radio-label');
        });
    }

}, {
    pk: "null",
    quantity: "1",
    removeConditionsLink: {}
});

$.fn.queryBuilder.extend({

    getOperatorLabelByType: function(type) {
        return this.lang.operators[type] || type;
    }

});
