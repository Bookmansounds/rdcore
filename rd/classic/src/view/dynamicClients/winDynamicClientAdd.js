Ext.define('Rd.view.dynamicClients.winDynamicClientAdd', {
    extend      : 'Ext.window.Window',
    alias       : 'widget.winDynamicClientAdd',
    closable    : true,
    draggable   : true,
    resizable   : true,
    title       : 'New Dynamic Client',
    width       : 500,
    height      : 510,
    plain       : true,
    border      : false,
    layout      : 'fit',
    glyph       : Rd.config.icnAdd,
    autoShow    : false,
    defaults    : {
            border  : false
    },
    no_tree     : false, //If the user has no children we don't bother giving them a branchless tree
    user_id     : '',
    owner       : '',
    startScreen : 'scrnApTree', //Default start screen
    requires: [
        'Ext.form.Panel',
        'Ext.form.field.Text',
        'Ext.form.FieldContainer',
        'Rd.view.components.btnDataNext'
    ],
    initComponent: function() {
        var me          = this;
        var scrnData    = me.mkScrnData();
        me.items = [
            scrnData
        ];  
        me.callParent(arguments);
    },

    mkScrnData: function(){
    
        var me      = this;

        var dataUnit = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data : [
                {"id":"mb",  "name":"MB"},
                {"id":"gb",  "name":"GB"}
            ]
        });


        // Create the combo box, attached to the states data store
        var cmbDataUnit = Ext.create('Ext.form.ComboBox', {
            fieldLabel      : 'Unit',
            store           : dataUnit,
            queryMode       : 'local',
            displayField    : 'name',
            valueField      : 'id',
            name            : 'data_limit_unit',
            itemId          : 'cmbDataLimitUnit',
            labelClsExtra   : 'lblRdReq',
            allowBlank      : false,
            forceSelection  : true,
            hidden          : true
        });
        cmbDataUnit.select(cmbDataUnit.getStore().getAt(0));
         
        var monitor_types = Ext.create('Ext.data.Store', {
            fields: ['id', 'text'],
            data : [
                {"id":"off",        "text": i18n("sOff")},
                {"id":"heartbeat",  "text": i18n("sHeartbeat")},
                {"id":"websocket",  "text": 'Websocket'}
            ]
        });

        // Create the combo box, attached to the states data store
        var cmbMt = Ext.create('Ext.form.ComboBox', {
            fieldLabel      : i18n('sMonitor_method'),
            store           : monitor_types ,
            itemId          : 'monitorType',
            name            : 'monitor',
            queryMode       : 'local',
            displayField    : 'text',
            valueField      : 'id',
            value           : 'off'
        });

        var frmData = Ext.create('Ext.form.Panel',{
            border:     false,
            layout:     'fit',
            itemId:     'scrnData',
            autoScroll: true,
            defaults: {
                anchor: '100%'
            },
            fieldDefaults: {
                msgTarget: 'under',
                labelClsExtra: 'lblRd',
                labelAlign: 'left',
                labelSeparator: '',
                margin      : Rd.config.fieldMargin,
                labelWidth  : Rd.config.labelWidth,
                maxWidth    : Rd.config.maxWidth  
            },
            defaultType: 'textfield',
            items:[
                {
                    xtype   : 'tabpanel',
                    layout  : 'fit',
                    xtype   : 'tabpanel',
                    margins : '0 0 0 0',
                    plain   : true,
                    tabPosition: 'bottom',
                    border  : false,
                    cls     : 'subTab',
                    items   : [
                        { 
                            title   : 'Basic',
                            layout  : 'anchor',
                            itemId  : 'tabBasic',
                            autoScroll: true,
                            defaults: {
                                anchor  : '100%'
                            },
                            items:[
                                 {
                                    xtype       : 'displayfield',
                                    fieldLabel  : 'Cloud',
                                    value       : me.cloudName,
                                    labelClsExtra: 'lblRdReq'
                                },
                                {
                                    xtype       : 'textfield',
                                    fieldLabel  : i18n('sName'),
                                    name        : "name",
                                    allowBlank  : false,
                                    blankText   : i18n("sSupply_a_value"),
                                    labelClsExtra: 'lblRdReq'
                                },
                                {
                                    xtype       : 'textfield',
                                    fieldLabel  : 'NAS-Identifier',
                                    name        : "nasidentifier",
                                    allowBlank  : true,
                                    labelClsExtra: 'lblRd'
                                },
                                {
                                    xtype       : 'textfield',
                                    fieldLabel  : 'Called-Station-Id',
                                    name        : "calledstationid",
                                    allowBlank  : true,
                                    labelClsExtra: 'lblRd'
                                }  
                            ]
                        },
                        { 
                            title   : 'Monitor',
                            itemId  : 'tabMonitor',
                            autoScroll: true,
                            layout    : 'anchor',
                            defaults    : {
                                anchor  : '100%'
                            },
                            items: [
                                cmbMt,
                                {
                                    xtype: 'numberfield',
                                    anchor: '100%',
                                    name: 'heartbeat_dead_after',
                                    itemId: 'heartbeat_dead_after',
                                    fieldLabel: i18n('sHeartbeat_is_dead_after'),
                                    value: 300,
                                    maxValue: 21600,
                                    minValue: 300,
                                    hidden: true
                                }
                            ]
                        },
                        { 
                            title   : 'Maps',
                            itemId  : 'tabMaps',
                            autoScroll: true,
                            layout    : 'anchor',
                            defaults    : {
                                anchor  : '100%'
                            },
                            items   : [
                                    {
                                    xtype       : 'numberfield',
                                    name        : 'lon',  
                                    fieldLabel  : i18n('sLongitude'),
                                    value       : 0,
                                    maxValue    : 180,
                                    minValue    : -180,
                                    decimalPrecision: 14,
                                    labelClsExtra: 'lblRd'
                                },
                                {
                                    xtype       : 'numberfield',
                                    name        : 'lat',  
                                    fieldLabel  : i18n('sLatitude'),
                                    value       : 0,
                                    maxValue    : 90,
                                    minValue    : -90,
                                    decimalPrecision: 14,
                                    labelClsExtra: 'lblRd'
                                },
                                {
                                    xtype       : 'checkbox',      
                                    boxLabel    : i18n('sDispaly_on_public_maps'),
                                    name        : 'on_public_maps',
                                    inputValue  : 'on_public_maps',
                                    checked     : false,
                                    cls         : 'lblRd',
                                    margin: Rd.config.fieldMargin
                                }    
                            ]
                        },
                        { 
                            title   : 'Enhancements',
                            itemId  : 'tabEnhancements',
                            autoScroll: true,
                            layout    : 'anchor',
                            defaults    : {
                                anchor  : '100%'
                            },
                            items: [
                                {
                                    xtype       : 'checkbox',      
                                    boxLabel    : i18n('sActive'),
                                    name        : 'active',
                                    inputValue  : 'active',
                                    itemId      : 'active',
                                    checked     : true,
                                    cls         : 'lblRd'
                                },
                                {
                                    xtype       : 'checkbox',      
                                    boxLabel    : i18n('sAuto_close_stale_sessions'),
                                    name        : 'session_auto_close',
                                    itemId      : 'chkSessionAutoClose',
                                    inputValue  : 'session_auto_close',
                                    checked     : true,
                                    cls         : 'lblRd',
                                    margin: Rd.config.fieldMargin
                                },
                                {
                                    xtype       : 'numberfield',
                                    itemId      : 'nrSessionDeadTime',
                                    anchor      : '100%',
                                    name        : 'session_dead_time',
                                    fieldLabel  : i18n('sAuto_close_activation_time'),
                                    value       : 300,
                                    maxValue    : 21600,
                                    minValue    : 300,
                                    hidden      : false
                                },
                                {
                                    xtype       : 'cmbTimezones',
                                    required    : false,
                                    value       : 24,
                                    allowBlank  : true
                                } 
                            ]
                        },
                        { 
                            title   : 'Data Limit',
                            itemId  : 'tabDataLimit',
                            autoScroll: true,
                            layout    : 'anchor',
                            defaults    : {
                                anchor  : '100%'
                            },
                            items: [
                                {
                                    xtype       : 'checkbox',      
                                    boxLabel    : i18n('sActive'),
                                    name        : 'data_limit_active',
                                    inputValue  : 'data_limit_active',
                                    itemId      : 'chkDataLimitActive',
                                    checked     : false,
                                    cls         : 'lblRd'
                                    
                                },
                                {
                                    xtype       : 'numberfield',
                                    itemId      : 'nrDataLimitAmount',
                                    anchor      : '100%',
                                    name        : 'data_limit_amount',
                                    fieldLabel  : 'Amount',
                                    value       : 1,
                                    maxValue    : 1023,
                                    minValue    : 1,
                                    hidden      : true,
                                    labelClsExtra   : 'lblRdReq'
                                },
                                cmbDataUnit,
                                {
                                    xtype       : 'numberfield',
                                    itemId      : 'nrDataLimitResetOn',
                                    anchor      : '100%',
                                    name        : 'data_limit_reset_on',
                                    fieldLabel  : 'Day To Reset',
                                    value       : 1,
                                    maxValue    : 31,
                                    minValue    : 1,
                                    hidden      : true,
                                    labelClsExtra   : 'lblRdReq'
                                },
                                {
                                    xtype       : 'numberfield',
                                    itemId      : 'nrDataLimitResetHour',
                                    anchor      : '100%',
                                    name        : 'data_limit_reset_hour',
                                    fieldLabel  : 'Hour To Reset',
                                    value       : 0,
                                    maxValue    : 23,
                                    minValue    : 0,
                                    hidden      : true,
                                    labelClsExtra   : 'lblRdReq'
                                },
                                {
                                    xtype       : 'numberfield',
                                    itemId      : 'nrDataLimitResetMinute',
                                    anchor      : '100%',
                                    name        : 'data_limit_reset_minute',
                                    fieldLabel  : 'Minute To Reset',
                                    value       : 0,
                                    maxValue    : 59,
                                    minValue    : 0,
                                    hidden      : true,
                                    labelClsExtra   : 'lblRdReq'
                                }
                                
                            ]
                        },
                        { 
                            title   : i18n('sRealms'),
                            itemId  : 'tabRealms',
                            tbar: [{
                                xtype       : 'checkboxfield',
                                boxLabel    : i18n('sMake_available_to_any_realm'), 
                                cls         : 'lblRd',
                                itemId      : 'chkAvailForAll',
                                name        : 'available_to_all',
                                inputValue  : true
                            }],
                            layout: 'fit',
                            items: { xtype: 'gridRealmsForDynamicClientCloud'}
                        }
                    ]
                }    
            ],
            buttons: [{ xtype : 'btnDataNext' }]
        });
        return frmData;
    }   
});
