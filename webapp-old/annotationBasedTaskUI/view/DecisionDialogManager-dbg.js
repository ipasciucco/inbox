/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"cross/fnd/fiori/inbox/annotationBasedTaskUI/util/i18n",
		"cross/fnd/fiori/inbox/annotationBasedTaskUI/util/util",
		"cross/fnd/fiori/inbox/annotationBasedTaskUI/util/GUILinkParser",
		"sap/m/Button",
		"sap/m/ButtonType",
		"sap/m/Dialog",
		"sap/m/DialogType",
		"sap/m/MessageBox",
		"sap/m/MessageToast"
	],
	function(
		I18n,
		Util,
		GUILinkParser,
		Button,
		ButtonType,
		Dialog,
		DialogType,
		MessageBox,
		MessageToast
	) {
		"use strict";

		var DecisionDialogManager = function(oParentView) {
			this.oParentView = oParentView;
			this.bWaitingForCallFunctionResponse = false;
		};

		DecisionDialogManager.prototype.setModels = function(oModels, oErrorSuppressionInfo) {
			this.oCachedModels = oModels;
			this.oErrorSuppressionInfo = oErrorSuppressionInfo;
		};

		DecisionDialogManager.prototype.setSubmissionCallback = function(fnCallback) {
			this.fnSubmissionCallback = fnCallback;
		};

		DecisionDialogManager.prototype.setTaskInstanceId = function(sTaskInstanceId) {
			this.sTaskInstanceId = sTaskInstanceId;
		};

		/**
		 * Takes a description of footer buttons in the S3 view and adds custom buttons
		 * according to the definitions in the metadata annotations.
		 * @param {object} oHeaderFooterOptions The existing header+footer options from the inboxDetailView
		 * @param {string} oGUILinkParser A GUI Link parser for reading the configured decisionactions
		 * @param {string} sEntityKey The key of the business object as a string, e.g. 'key12345'
		 * @returns {object} The modified header+footer options which should be set in the inboxDetailView
		 */
		DecisionDialogManager.prototype.modifyFooterButtons = function(oHeaderFooterOptions, oGUILinkParser, sEntityKey) {
			var oModels = this.oCachedModels;

			// Helper function to add buttons in the format expected by inboxDetailView
			var fnAddButton = function(oButtonData) {
				var oButton = {
					onBtnPressed: this.createDecisionDialog.bind(this, oButtonData),
					sBtnTxt: oButtonData.Label
				};
				// Note: There can be only one positive and one negative button. We move existing buttons to the
				// buttonList and replace them with new buttons from the annotations.
				// We also log this incident to the console as the administrator should make sure that this never happens.
				if (oButtonData.Nature === "POSITIVE") {
					if (oHeaderFooterOptions.oPositiveAction) {
						jQuery.sap.log.error("[Decision Dialog] There were multiple positive actions. New button '" +
							oButtonData.Label + "' displaced existing button '" + oHeaderFooterOptions.oPositiveAction.sBtnTxt + "'");
						oHeaderFooterOptions.buttonList.unshift(oHeaderFooterOptions.oPositiveAction);
					}
					oHeaderFooterOptions.oPositiveAction = oButton;
				} else if (oButtonData.Nature === "NEGATIVE") {
					if (oHeaderFooterOptions.oNegativeAction) {
						jQuery.sap.log.error("[Decision Dialog] There were multiple negative actions. New button '" +
							oButtonData.Label + "' displaced existing button '" + oHeaderFooterOptions.oNegativeAction.sBtnTxt + "'");
						oHeaderFooterOptions.buttonList.unshift(oHeaderFooterOptions.oNegativeAction);
					}
					oHeaderFooterOptions.oNegativeAction = oButton;
				} else {
					oHeaderFooterOptions.buttonList.unshift(oButton);
				}
			}.bind(this);

			// Parse GUI Link to extract the entity names and qualifiers that define the buttons
			var oActionEntities = oGUILinkParser.getDecisionActions();

			// Collect information about all required buttons, then add those buttons to the footer
			this.collectButtonDataFromAnnotations(oActionEntities).reverse().forEach(function(oButtonData) {
				jQuery.sap.log.trace("[Decision Dialog] Adding button '" + oButtonData.Label +
					"' with annotations on entity '" + oButtonData.Entity + "'");
				oButtonData.BindingPath = Util.standardizeEntityKey(oModels.businessModel, oButtonData.EntitySet, sEntityKey);
				fnAddButton(oButtonData);
			});
			return oHeaderFooterOptions;
		};

		DecisionDialogManager.prototype.collectButtonDataFromAnnotations = function(oActionEntities) {
			var oModels = this.oCachedModels;
			var aButtonData = [];

			// Loop over all entities from the decision actions provided by the GUI_Link
			oActionEntities.forEach(function(oActionEntity) {
				var oEntityType = oModels.businessMetaModel.getODataEntityType(oActionEntity.entityName);
				var sAnnotationPath = "com.sap.vocabularies.UI.v1.FieldGroup" + oActionEntity.qualifier;

				if (!oEntityType) {
					jQuery.sap.log.error("[Decision Dialog] The entity type '" + oActionEntity.entityName +
						"' from the GUI_Link decision actions could not be resolved");
				} else if (oEntityType.hasOwnProperty(sAnnotationPath)) {

					// Read annotations for the specified entity and create a button data object for each DataFieldForAction
					var aDialogFieldsAnnotation = oEntityType[sAnnotationPath];
					aDialogFieldsAnnotation.forEach(function(oAnnotation) {
						// The annotation also contains DataFields which are irrelevant here
						if (oAnnotation.RecordType !== "com.sap.vocabularies.UI.v1.DataFieldForAction") {
							return;
						}

						var sLabel = (oAnnotation.Label && oAnnotation.Label.String) || "[MISSING LABEL]";
						var sAction = (oAnnotation.Action && oAnnotation.Action.String) || "[MISSING ACTION]";
						if (sLabel === "[MISSING LABEL]") {
							jQuery.sap.log.error("[Decision Dialog] Missing property 'Label' in SubmitActions for entity '" +
								oEntityType.name + "'");
						}
						if (sAction === "[MISSING ACTION]") {
							jQuery.sap.log.error("[Decision Dialog] Missing property 'Action' in SubmitActions for entity '" +
								oEntityType.name + "'");
						}

						aButtonData.push({
							Entity: oEntityType.namespace + "." + oEntityType.name,
							Label: sLabel,
							Action: sAction,
							Nature: (oAnnotation.Nature && oAnnotation.Nature.String) || "",
							DialogFieldsAnnotation: aDialogFieldsAnnotation
						});
					});
				} else {
					jQuery.sap.log.error("[Decision Dialog] Entity '" + oActionEntity.entityName +
						"' is not annotated with a UI.FieldGroup that has qualifier '" + oActionEntity.qualifier + "'");
				}
			});

			// Loop over all EntitySets in the default entity container to match them to the entities found in the previous step
			var oEntityContainer = oModels.businessMetaModel.getODataEntityContainer();
			if (oEntityContainer.entitySet) {
				oEntityContainer.entitySet.forEach(function(oEntitySet) {
					aButtonData.forEach(function(oButtonData) {
						if (oEntitySet.entityType === oButtonData.Entity) {
							oButtonData.EntitySet = oEntitySet.name;
						}
					});
				});
			}

			// Assure that all EntitySets have been found and resolve function imports by name
			aButtonData.forEach(function(oButtonData) {
				if (!oButtonData.EntitySet) {
					jQuery.sap.log.error("[Decision Dialog] EntitySet for entity '" + oButtonData.Entity +
						"' could not be found");
				}
				if (jQuery.sap.startsWith(oButtonData.Action, "/")) {
					// Possibly a common error, so we log it to the console
					jQuery.sap.log.error("[Decision Dialog] FunctionImport name '" + oButtonData.Action +
						"' annotated on DataFieldForAction on entity '" + oButtonData.Entity +
						"' should not start with a leading slash");
				}
				var functionImport = oModels.businessMetaModel.getODataFunctionImport(oButtonData.Action);
				if (functionImport) {
					oButtonData.FunctionImportParameters = functionImport.parameter || [];
					oButtonData.Action = functionImport.name;
				} else {
					jQuery.sap.log.error("[Decision Dialog] FunctionImport '" + oButtonData.Action +
						"' annotated on DataFieldForAction on entity '" + oButtonData.Entity + "' could not be resolved");
				}
			});

			return aButtonData;
		};

		DecisionDialogManager.prototype.createDecisionDialog = function(oButtonData) {
			// Create a new model that points to the correct annotation containing the DataFields for the dialog.
			// Note: This is necessary because the qualifier is passed in via the GUI_Link, but we cannot access
			// the metadata for a dynamic qualifier from a static xml template
			var oAnnotationModel = new sap.ui.model.json.JSONModel({
				dialogFields: oButtonData.DialogFieldsAnnotation
			});

			// During preprocessing the XML View creates the dialog contents based on the annotations
			// of the oButtonData.Entity that was passed in (passed to the preprocessor via the binding path)
			var oDialogView = sap.ui.view("DecisionDialogView", {
				viewName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.view.DecisionDialog",
				type: sap.ui.core.mvc.ViewType.XML,
				preprocessors: {
					xml: {
						models: {
							meta: oAnnotationModel
						}
					}
				}
			});
			this.oParentView.addDependent(oDialogView);

			// Bind the business model to the view
			var oModels = this.oCachedModels;
			oDialogView.setModel(oModels.businessModel);
			oDialogView.bindElement(oButtonData.BindingPath);

			// Reset changes in the business model, if there are any from a previous edit
			if (oModels.businessModel.hasPendingChanges()) {
				oModels.businessModel.resetChanges();
			}

			// Fetch controls that need to have their values edited
			var oDialog = oDialogView.byId("DecisionDialog");
			var oBtnSubmit = oDialogView.byId("SubmitBtn");
			var oBtnCancel = oDialogView.byId("CancelBtn");

			// Adjust title, button labels, icon, event handlers and initial focus
			oDialog.setTitle(oButtonData.Label);
			oDialog.attachAfterClose(this.destroyDecisionDialog.bind(this));
			oBtnSubmit.setText(oButtonData.Label);
			oBtnCancel.setText(I18n.getText("DECISION_DIALOG.CANCEL"));
			oBtnSubmit.attachPress(this.onSubmitDecisionDialog.bind(this, oButtonData));
			oBtnCancel.attachPress(this.onCancelDecisionDialog.bind(this));
			oDialog.setInitialFocus(oBtnCancel);

			// Store components: Dialog is needed to close it later; View is needed to destroy it after closing
			jQuery.sap.log.trace("[Decision Dialog] Opening dialog for button '" + oButtonData.Label + "'");
			this.oDialog = oDialog;
			this.oDialogView = oDialogView;
			this.oDialog.open();
		};

		DecisionDialogManager.prototype.onSubmitDecisionDialog = function(oButtonData) {
			// Catch duplicate button presses
			if (this.bWaitingForCallFunctionResponse) {
				jQuery.sap.log.debug("[Decision Dialog] Prevented submit, because a function import call is already in progress");
				return;
			}

			// Use the SmartForm to check for user input errors on the client side
			// This is a fallback in case the user manages to click submit even though the form contains errors
			// which should not be possible under normal circumstances
			var aErrors = this.oDialogView.byId("DecisionForm").check();
			if (aErrors.length > 0) {
				var oFirstErrorField = this.oDialogView.byId(aErrors[0]);
				this.showErrorMessage(I18n.getText("DECISION_DIALOG.ERROR.FORM"), true, oFirstErrorField);
				jQuery.sap.log.debug("[Decision Dialog] Tried to submit action '" + oButtonData.Label +
					"' but the SmartForm contained errors");
				return;
			}

			// Collect the parameters that were entered by the user.
			var oModels = this.oCachedModels;
			var oProvidedValues = oModels.businessModel.getObject(oButtonData.BindingPath);
			if (oProvidedValues === undefined) {
				jQuery.sap.log.fatal("[Decision Dialog] Unable to retrieve the values entered by the user.");
			}

			// Loop over the parameters of the function import and copy the values from the user provided values
			var oActionUriParameters = {};
			oButtonData.FunctionImportParameters.forEach(function(oParameter) {
				if (oParameter.name === "TaskInstanceID") {
					// Magic name TaskInstanceID
					oActionUriParameters.TaskInstanceID = this.sTaskInstanceId;
				} else if (oProvidedValues[oParameter.name] === undefined) {
					jQuery.sap.log.error("[Decision Dialog] Parameter '" + oParameter.name + "' for FunctionImport '" +
						oButtonData.Action + "' is missing from the data contained in the decision dialog");
				} else {
					oActionUriParameters[oParameter.name] = oProvidedValues[oParameter.name];
				}
			}.bind(this));

			// Define callback functions for success and error of the function import call
			var fnCallSuccess = function(sReturnValue, oResponse) {
				this.oDialog.setBusy(false);
				this.oDialog.close();
				this.bWaitingForCallFunctionResponse = false;

				// Accept both ways in which the response could be returned, either as string or as an object of type { "results": "..." }.
				// UI5's ODataModel contains a workaround that removes the wrapping object under certain circumstances with the comment
				// "broken implementations need this". The workaround's behavior also changed slightly between 1.68.X and 1.70.X
				if (sReturnValue && sReturnValue.results) {
					sReturnValue = sReturnValue.results;
				}

				MessageToast.show((typeof sReturnValue === "string" && sReturnValue) ||
					I18n.getText("DECISION_DIALOG.SUCCESS.GENERIC", [oButtonData.Label]));

				jQuery.sap.log.trace("[Decision Dialog] Function import '" + oButtonData.Action +
					"' was called successfully (status code: " + oResponse.statusCode + ")" +
					typeof sReturnValue === "string" ? (" and returned: " + sReturnValue) : ", but didn't return a string");

				if (this.fnSubmissionCallback) {
					this.fnSubmissionCallback();
				}
			}.bind(this);

			var fnCallError = function(oError) {
				jQuery.sap.log.debug("[Decision Dialog] Function import '" + oButtonData.Action +
					"' failed with status code " + oError.statusCode);

				// Extract error message from response or fall back to default error message
				var sErrorMsg;
				var sErrorCode = "SERVER_ERROR";
				if (oError.responseText && typeof oError.responseText === "string") {
					try {
						var oResponse = JSON.parse(oError.responseText);
						if (oResponse.error.code === "INVALID_DATA" || oResponse.error.code === "SERVER_ERROR") {
							sErrorCode = oResponse.error.code;
						}
						if (oResponse.error.message.value && typeof oResponse.error.message.value === "string") {
							sErrorMsg = oResponse.error.message.value;
							jQuery.sap.log.debug("[Decision Dialog] Function import '" + oButtonData.Action +
								"' returned error message: " + sErrorMsg);
						}
					} catch (oException) {
						// Ignore error parsing exceptions. If sErrorMsg is empty it will be replaced by default message
						jQuery.sap.log.error("[Decision Dialog] Error returned by function import '" + oButtonData.Action +
							"' could not be parsed");
						sErrorMsg = null;
					}
				}
				sErrorMsg = sErrorMsg || I18n.getText("DECISION_DIALOG.ERROR." + sErrorCode);

				this.oDialog.setBusy(false);
				this.bWaitingForCallFunctionResponse = false;
				this.showErrorMessage(sErrorMsg, sErrorCode === "INVALID_DATA");
			}.bind(this);

			// Display a busy indicator and then invoke the function import that belongs to this button
			// Busy indicator will be reset in the success and error handlers
			this.oDialog.setBusyIndicatorDelay(100);
			this.oDialog.setBusy(true);
			this.bWaitingForCallFunctionResponse = true;
			jQuery.sap.log.trace("[Decision Dialog] Calling function import '" + oButtonData.Action +
				"' in order to submit action '" + oButtonData.Label + "'");
			oModels.businessModel.callFunction("/" + oButtonData.Action, {
				method: "POST",
				urlParameters: oActionUriParameters,
				success: fnCallSuccess,
				error: fnCallError
			});
		};

		DecisionDialogManager.prototype.onCancelDecisionDialog = function() {
			this.oDialog.close();
		};

		DecisionDialogManager.prototype.destroyDecisionDialog = function() {
			this.oDialogView.destroy();
			jQuery.sap.log.trace("[Decision Dialog] Dialog was destroyed");
		};

		DecisionDialogManager.prototype.showErrorMessage = function(sErrorMsg, bIsValidationError, oFocusElementAfterClose) {
			this.oDialog.setVisible(false);
			// This flag suppresses the default error handler which listens on the businessModel for batchRequestFailed events
			// Note: Implicit assumption is that our own error handler is always called before the batchRequestFailed event fires
			this.oErrorSuppressionInfo.bHandleErrors = false;

			var sRetryButtonText;
			var sCancelButtonText = MessageBox.Action.CANCEL;
			if (bIsValidationError) {
				sRetryButtonText = I18n.getText("DECISION_DIALOG.ERROR.VALIDATION.BUTTON");
			} else {
				sRetryButtonText = I18n.getText("DECISION_DIALOG.ERROR.TECHNICAL.BUTTON");
			}

			MessageBox.show(sErrorMsg, {
				icon: MessageBox.Icon.ERROR,
				title: I18n.getText("DECISION_DIALOG.ERROR.TITLE"),
				actions: [sRetryButtonText, sCancelButtonText],
				initialFocus: sRetryButtonText,
				onClose: function(sAction) {
					// Reset error handling flag, so the default handler handles all further errors
					this.oErrorSuppressionInfo.bHandleErrors = true;
					if (sAction === sCancelButtonText) {
						this.oDialog.close();
					} else if (sAction === sRetryButtonText) {
						// Focus the field that was passed in. This is usually the one containing an error.
						if (oFocusElementAfterClose) {
							this.oDialog.setInitialFocus(oFocusElementAfterClose);
						} else {
							this.oDialog.setInitialFocus(this.oDialogView.byId("CancelBtn"));
						}
						this.oDialog.setVisible(true);
					} else {
						// Note: This case occurs when ESC is pressed in the MessageBox, which sets sAction to null
						this.oDialog.close();
					}
				}.bind(this)
			});
		};

		return DecisionDialogManager;

	}, true);