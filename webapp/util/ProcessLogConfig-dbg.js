/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
    ], function () {
    "use strict";

    var oProcessLogConfig = {
        "DEADLINE_REACHED": {
            "icon": "sap-icon://fob-watch",
            "showUsername": false
        },
        "REJECTED": {
            "icon": "sap-icon://inspect-down",
            "showUsername": true
        },
        "APPROVED": {
            "icon": "sap-icon://complete",
            "showUsername": true
        },
        "ATTACHMENT_ADDED": {
            "icon": "sap-icon://attachment",
            "showUsername": true
        },
        "ATTACHMENT_DELETED": {
            "icon": "sap-icon://attachment",
            "showUsername": true
        },
        "FORWARDED": {
            "icon": "sap-icon://forward",
            "showUsername": true
        },
        "RELEASED": {
            "icon": "sap-icon://unlocked",
            "showUsername": true
        },
        "RESERVED": {
            "icon": "sap-icon://locked",
            "showUsername": true
        },
        "STATUS_CHANGED": {
            "icon": "sap-icon://order-status",
            "showUsername": true
        },
        "COMPLETED": {
            "icon": "sap-icon://complete",
            "showUsername": true
        },
        "CONTAINER_UPDATED": {
            "icon": "",
            "showUsername": false
        },
        "CALLBACK_DONE": {
            "icon": "sap-icon://process",
            "showUsername": false
        },
        "EXCEPTION_OCCURRED": {
            "icon": "sap-icon://",
            "showUsername": false
        },
        "CREATED_BACKGROUND": {
            "icon": "sap-icon://create",
            "showUsername": false
        },
        "DEADLINE_MESSAGE_CREATED": {
            "icon": "sap-icon://timesheet",
            "showUsername": false
        },
        "EXECUTED": {
            "icon": "sap-icon://begin",
            "showUsername": false
        },
        "RESTARTED_BY_ADMIN": {
            "icon": "sap-icon://repost",
            "showUsername": false
        },
        "EXECUTED_BY_ADMIN": {
            "icon": "sap-icon://begin",
            "showUsername": false
        },
        "RELEASED_BY_ADMIN": {
            "icon": "sap-icon://unlocked",
            "showUsername": false
        },
        "RETURNED": {
            "icon": "sap-icon://unlocked",
            "showUsername": true
        },
        "DEADLINES_CHANGED": {
            "icon": "sap-icon://time-entry-request",
            "showUsername": true
        },
        "DISPLAYED_FOR_MAIL": {
            "icon": "sap-icon://letter",
            "showUsername": false
        },
        "OBJECT_HANDLE_CHANGE": {
            "icon": "",
            "showUsername": false
        },
        "PRIORITY_CHANGED": {
            "icon": "sap-icon://quality-issue",
            "showUsername": true
        },
        "RESUBMISSION_ENDED": {
            "icon": "sap-icon://past",
            "showUsername": false
        },
        "RESUBMITTED": {
            "icon": "sap-icon://future",
            "showUsername": true
        },
        "SELECTED": {
            "icon": "sap-icon://locked",
            "showUsername": true
        },
        "CANCELLED": {
            "icon": "sap-icon://delete",
            "showUsername": true
        },
        "EXECUTED_WITHOUT_WLC": {
            "icon": "sap-icon://begin",
            "showUsername": false
        },
        "CREATED": {
            "icon": "sap-icon://create",
            "showUsername": true
        },
        "WORKFLOW_STARTED": {
            "icon": "sap-icon://log",
            "showUsername": true
        },
        "WORKFLOW_TASK_CREATED": {
            "icon": "sap-icon://create",
            "showUsername": true
        },
        "WORKFLOW_TASK_IN_PROGRESS": {
            "icon": "sap-icon://future",
            "showUsername": true
        },
        "WORKFLOW_TASK_COMPLETED": {
            "icon": "sap-icon://complete",
            "showUsername": true
        },
        "WORKFLOW_TASK_SUSPENDEDED": {
            "icon": "sap-icon://future",
            "showUsername": true
        },
        "IMPERSONAL_WORKFLOW_TASK_SUSPENDEDED": {
            "icon": "sap-icon://future",
            "showUsername": false
        },
        "WORKFLOW_TASK_CANCELED": {
            "icon": "sap-icon://delete",
            "showUsername": true
        },
        "IMPERSONAL_WORKFLOW_TASK_CANCELED": {
            "icon": "sap-icon://delete",
            "showUsername": true
        }
    };

    return {

        getProcessLogConfig: function () {
            return oProcessLogConfig;
        }
    };
});
