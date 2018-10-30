import { Version, Environment, EnvironmentType } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import { escape, isEmpty } from '@microsoft/sp-lodash-subset';
import { SPComponentLoader } from '@microsoft/sp-loader';
import 'jquery';
import styles from './TripWebPartWebPart.module.scss';
import * as strings from 'TripWebPartWebPartStrings';
import { ISPHttpClientOptions, SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { Component } from 'react';
import * as pnp from 'sp-pnp-js';
require ('chartjs');
require ('bootstrap');
import Chart from 'chart.js';
export interface ITripWebPartWebPartProps {
  description: string;
}
      var currentUserId;
      var isVoted;
      var selectedTrip;
      var updateId;
      var chartdata = [];
      var locationArray = [];
      var allLocations = new Array();
      var VoterCount = new Array();
export default class TripWebPartWebPart extends BaseClientSideWebPart<ITripWebPartWebPartProps> {

  public render(): void {
    let cssURL = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css";
    let fontUrl = "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css";
    SPComponentLoader.loadCss(cssURL);
    SPComponentLoader.loadCss(fontUrl);
    this.domElement.innerHTML = `
     <input type="hidden" id="updateValue">
      <div class="container col-md-12">
        <div class="row">
          <div class="container text-center col-md-12">
            <h1 style="padding-bottom: 5%;">Trip Spots/Location</h1>      
              <ul class="list-inline" id="locations">
              </ul>              
              <button type="button" class="btn btn-success submission" style="margin-top: 5%;">Submit</button>
          </div>
        <div>
      </div>

      <div id="PieChartDiv">
            <canvas id="pieChart"></canvas>
      </div>
      `;
      var canvas = <HTMLCanvasElement> document.getElementById("pieChart");
      var cntxt = canvas.getContext("2d"); 
      var Absourl = this.context.pageContext.web.absoluteUrl;    
      
      $(document).ready(function()
      {
        GetUserDetails();
        PopulateTripLocation();       
        allItemsCount();
        isVotedBefore();

        /****************get current user******************/
        function GetUserDetails() {  
          var url = Absourl + "/_api/web/currentuser";  
          $.ajax({  
              url: url,  
              headers: {  
                  Accept: "application/json;odata=verbose"  
              },  
              async: false,  
              success: function (data) {  
                  currentUserId = data.d.Id; 
              },  
              error: function (data) {  
                  alert("An error occurred. Please try again.");  
              }  
          });  
      }  

      function isVotedBefore()
      {
        var call = jQuery.ajax({
          url: Absourl + "/_api/Web/Lists/getByTitle('DscVoting')/Items?$select=Title,ID,LocationId&$filter=(Author eq '"+currentUserId+"')",
          type: "GET",
          dataType: "json",
          async: false,  
          headers: {
              Accept: "application/json; odata=verbose",
              "Content-Type": "application/json;odata=verbose"
          }
      });
        call.done(function (data, textStatus, jqXHR) {          
          isVoted = data.d.results.length;
          if(isVoted > 0)
          {
            updateId = data.d.results[0].ID;
            selectedTrip = data.d.results[0].LocationId;
            $("#updateValue").attr("value", data.d.results[0].Id);
            $(".btn-primary").attr("disabled","disabled");
            $(".dscicon").removeClass("fa-thumbs-up");
            $(".dscicon").addClass("fa-thumbs-down");
            $("#"+selectedTrip).removeAttr("disabled");
            $("#icon"+selectedTrip).removeClass("fa-thumbs-down");
            $("#icon"+selectedTrip).addClass("fa-thumbs-up");
          }
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
            var response = JSON.parse(jqXHR.responseText);
            var message = response ? response.error.message.value : textStatus;
            alert("error getting usvoted: " + message);
        });

        /**********************************************/
        var myPieChart = new Chart(cntxt, {
          type: 'pie',
          data: {
            labels: locationArray,
              datasets: [
                  {
                      labels: locationArray,
                      data: VoterCount,
                      backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1"],   //"#4D5360"
                      hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#A8B3C5"]
                  }
              ]
          },
          options: {
              responsive: true
          }
      });
      /**********************************************/
      }
       
      function allItemsCount()
      {
        var call = jQuery.ajax({
        url: Absourl + "/_api/Web/Lists/getByTitle('DscVoting')/Items?$select=Title,ID,LocationId",
          type: "GET",
          dataType: "json",
          async: false,  
          headers: {
              Accept: "application/json; odata=verbose",
              "Content-Type": "application/json;odata=verbose"
          }
        });
        call.done(function (data, textStatus, jqXHR) {  
          for(var i=0;i<allLocations.length;i++)
          {
           VoterCount.push(data.d.results.filter(value => value.LocationId === allLocations[i].Id).length);
          }
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
            var response = JSON.parse(jqXHR.responseText);
            var message = response ? response.error.message.value : textStatus;
            alert("Call hutch failed. Error: " + message);
        });
      }

      /******************Populating trip locaions*******************/
      function PopulateTripLocation()
      {
        var call = jQuery.ajax({
          url: Absourl + "/_api/Web/Lists/getByTitle('DscTripLocation')/Items?$select=Title,ID&$orderby=Title desc",
          type: "GET",
          dataType: "json",
          async: false,  
          headers: {
              Accept: "application/json; odata=verbose",
              "Content-Type": "application/json;odata=verbose"
          }
      });
        call.done(function (data, textStatus, jqXHR) {          
            $('#locations li').remove();
            var orderedList = $('#locations');
            allLocations = data.d.results; 
            var counter = 10;
            $.each(data.d.results, function (idx, elem) {
                orderedList.append("<div class='col-md-3'><div class='col-md-12' style='margin-bottom: 7%; font-weight:bold;'>"+elem.Title+"</div><div class='col-md-12'><li><button type='button' class='btn btn-primary' id='" + elem.ID + "'><i class='fa fa-thumbs-up fa-2x dscicon' id='icon"+ elem.ID +"'></button></li></div></div>");
             chartdata [idx] ={
              label: elem.Title,
              color: "#F7464A",
              highlight: "#F7464A",
              value: counter
             }
             locationArray.push(elem.Title);
             counter ++;
            });
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
            var response = JSON.parse(jqXHR.responseText);
            var message = response ? response.error.message.value : textStatus;
            alert("Call hutch failed. Error: " + message);
        });
      }
      /******************Populating trip locaions*******************/
          
        /***************For First Time**********************/
        $(document).on("click", ".btn-primary" , function() {
            if(selectedTrip == null || selectedTrip=='')
            {
              selectedTrip = $(this).attr("id");
              $(".btn-primary").attr("disabled","disabled");
              $(".dscicon").removeClass("fa-thumbs-up");    
              $(".dscicon").addClass("fa-thumbs-down");    
              $("#"+selectedTrip).removeAttr("disabled"); 
              $("#icon"+selectedTrip).removeClass("fa-thumbs-down"); 
              $("#icon"+selectedTrip).addClass("fa-thumbs-up");                     
            }
            else
            {
              $(".btn-primary").removeAttr("disabled");
              selectedTrip='';
              $(".dscicon").addClass("fa-thumbs-down");
            }            
        });        
      });

     this.OnSubmitClick();
  }

  OnSubmitClick()
  {
    this.domElement.querySelector(".btn-success").addEventListener('click',() => this.saveChangesToList());
  }

  IsFirstVote()
  {
    this.context.spHttpClient.get(
      this.context.pageContext.web.absoluteUrl+`/_api/Web/Lists/getByTitle('DscVoting')/Items?$select=Title,ID,LocationId&$filter=(Author eq '`+currentUserId+`')`,
      SPHttpClient.configurations.v1
    )
    .then((response: SPHttpClientResponse) => {
      response.json().then((listsObjects: any) => {
        if(listsObjects.length >=1)
        {
          listsObjects.value.forEach(listObject => {
          
            updateId =   listObject.ID;
            selectedTrip = listObject.LocationId; //     <option value="${listObject.ID}">${listObject.Category}</option>                   
          });        
        }
        else
        {
          updateId = '';
        }
      });
    });
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }

  saveChangesToList()
  {
    if (Environment.type === EnvironmentType.Local) {
      this.domElement.querySelector('#listdata').innerHTML = "Sorry this does not work in local workbench";
    } 
    else{
      /*************Check Voter*************************/
      this.context.spHttpClient.get(
        this.context.pageContext.web.absoluteUrl+`/_api/Web/Lists/getByTitle('DscVoting')/Items?$select=Title,ID,LocationId&$filter=(Author eq '`+currentUserId+`')`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((listsObjects: any) => {
          
            listsObjects.value.forEach(listObject => {            
              updateId =   listObject.ID;
              selectedTrip = listObject.LocationId; 
            });
        });
      });
      if(selectedTrip == null || selectedTrip == '' || selectedTrip == isEmpty)
      {
        alert("Please Select Location");
      }
      else
      {
        if(updateId == '' || updateId == null || updateId == isEmpty)
        {
             pnp.sp.web.lists.getByTitle('DscVoting').items.add({ Title :'Inserted',LocationId : selectedTrip})
            .then(() =>
            {
            //   var call = jQuery.ajax({
            //     url: this.context.pageContext.web.absoluteUrl + "/_api/Web/Lists/getByTitle('DscVoting')/Items?$select=Title,ID,LocationId&$filter=(Author eq '"+currentUserId+"')",
            //     type: "GET",
            //     dataType: "json",
            //     async: false,  
            //     headers: {
            //         Accept: "application/json; odata=verbose",
            //         "Content-Type": "application/json;odata=verbose"
            //     }
            // });
            //   call.done(function (data, textStatus, jqXHR) {          
            //     isVoted = data.d.results.length;
                
                
            //   });
            //   call.fail(function (jqXHR, textStatus, errorThrown) {
            //     var response = JSON.parse(jqXHR.responseText);
            //     var message = response ? response.error.message.value : textStatus;
            //     alert("error getting usvoted: " + message);
            //   });
              alert("Inserted Successfully!!!");
              window.location.reload();
             // this.redrawChart();
            });             
        }
        else
        {        
            alert("record to update :"+updateId);
            pnp.sp.web.lists.getByTitle('DscVoting').items.getById(parseInt(updateId)).update({Title :'Updated',LocationId : selectedTrip})
            .then(() => { 
              alert("Updated Successfully!!!");
              this.redrawChart();
             });             
        }
      }
    }
  }

  redrawChart()
  {
    var call = jQuery.ajax({
      url: this.context.pageContext.web.absoluteUrl + "/_api/Web/Lists/getByTitle('DscVoting')/Items?$select=Title,ID,LocationId",
        type: "GET",
        dataType: "json",
        async: false,  
        headers: {
            Accept: "application/json; odata=verbose",
            "Content-Type": "application/json;odata=verbose"
        }
      });
      call.done(function (data, textStatus, jqXHR) {  
        VoterCount = [];
          for(var i=0;i<allLocations.length;i++)
          {
            VoterCount.push(data.d.results.filter(value => value.LocationId === allLocations[i].Id).length);
          }
          $("#PieChartDiv").empty();   //<canvas id="pieChart"></canvas>
          var PieChartDiv = $('#PieChartDiv');
          PieChartDiv.append(" <canvas id='pieChart'></canvas>");
          var canvas = <HTMLCanvasElement> document.getElementById("pieChart");
          var cntxt = canvas.getContext("2d"); 
          var myPieChart = new Chart(cntxt, {
            type: 'pie',
            data: {
              labels: locationArray,
                datasets: [
                    {
                        labels: locationArray,
                        data: VoterCount,
                        backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C", "#4D5360"],   //"#4D5360"
                        hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#A8B3C5"]
                    }
                ]
            },
            options: {
                responsive: true
            }
        });
      });
      call.fail(function (jqXHR, textStatus, errorThrown) {
      });
  }
}
