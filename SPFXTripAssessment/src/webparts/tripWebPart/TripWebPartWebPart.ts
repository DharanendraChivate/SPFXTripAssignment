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
export default class TripWebPartWebPart extends BaseClientSideWebPart<ITripWebPartWebPartProps> {

  public render(): void {
    let cssURL = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css";
    let fontUrl = "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css";
   // let chartJs = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.4.0/Chart.min.js";
    SPComponentLoader.loadCss(cssURL);
    SPComponentLoader.loadCss(fontUrl);
  //  SPComponentLoader.loadScript(chartJs);
    this.domElement.innerHTML = `
      <!--<div class="${ styles.tripWebPart }">
        <div class="${ styles.container }">
          <div class="${ styles.row }">
            <div class="${ styles.column }">
              <span class="${ styles.title }">Welcome to SharePoint!</span>
              <p class="${ styles.subTitle }">Customize SharePoint experiences using Web Parts.</p>
              <p class="${ styles.description }">${escape(this.properties.description)}</p>
             
              <a href="https://aka.ms/spfx" class="btn btn-primary">
                <span class="${ styles.label }">Learn more</span>
              </a>
              <button type="button" class="btn btn-success"><i class="fa fa-thumbs-up fa-2x"></i></button>
            </div>
          </div>
        </div>
      </div>-->

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

      <div col-md-12>
            <canvas id="pieChart"></canvas>
      </div>

      `;
      var canvas = <HTMLCanvasElement> document.getElementById("pieChart");
      var cntxt = canvas.getContext("2d"); 
      var Absourl = this.context.pageContext.web.absoluteUrl;
      var allLocations = new Array();
      
      $(document).ready(function()
      {
        GetUserDetails();
        PopulateTripLocation();
        isVotedBefore();
        /****************get current user******************/
        function GetUserDetails() {  
         // alert("current user get");
          var url = Absourl + "/_api/web/currentuser";  
          $.ajax({  
              url: url,  
              headers: {  
                  Accept: "application/json;odata=verbose"  
              },  
              async: false,  
              success: function (data) {  
                  currentUserId = data.d.Id; // Data will have user object      
                  //alert("items :"+items.Id);
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
          headers: {
              Accept: "application/json; odata=verbose",
              "Content-Type": "application/json;odata=verbose"
          }
      });
        call.done(function (data, textStatus, jqXHR) {          
          isVoted = data.d.results.length;
          alert("isvoted 116 :"+isVoted);
          if(isVoted > 0)
          {
            updateId = data.d.results[0].ID;
            selectedTrip = data.d.results[0].LocationId;
            $("#updateValue").attr("value", data.d.results[0].Id);
            alert("if voted selected trip :"+selectedTrip);
            $(".btn-primary").attr("disabled","disabled");
            $(".dscicon").removeClass("fa-thumbs-up");
            $(".dscicon").addClass("fa-thumbs-down");
            $("#"+selectedTrip).removeAttr("disabled");
            alert("Previous selected Location :"+selectedTrip);
            $("#icon"+selectedTrip).removeClass("fa-thumbs-down");
            $("#icon"+selectedTrip).addClass("fa-thumbs-up");
          }
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
       //   alert("fail dattaaa");
            var response = JSON.parse(jqXHR.responseText);
            var message = response ? response.error.message.value : textStatus;
            alert("error getting usvoted: " + message);
        });
      }
       
      function allItemsCount()
      {
        var call = jQuery.ajax({
          url: Absourl + "/_api/Web/Lists/getByTitle('DscVoting')?$count&$orderby=Title",
          type: "GET",
          dataType: "json",
          headers: {
              Accept: "application/json; odata=verbose",
              "Content-Type": "application/json;odata=verbose"
          }
      });
        call.done(function (data, textStatus, jqXHR) {          
            $('#locations li').remove();
            var orderedList = $('#locations');
            $.each(data.d.results, function (idx, elem) {
                orderedList.append("<div class='col-md-3'><div class='col-md-12' style='margin-bottom: 7%; font-weight:bold;'>"+elem.Title+"</div><div class='col-md-12'><li><button type='button' class='btn btn-primary' id='" + elem.ID + "'><i class='fa fa-thumbs-up fa-2x dscicon' id='icon"+ elem.ID +"'></button></li></div></div>");
               // orderedList.append("<div class='col-md-3'><li><button type='button' class='btn btn-primary' id='" + elem.ID + "'><i class='fa fa-thumbs-up fa-2x'></button></li></div>");
              
            });
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
       //   alert("fail dattaaa");
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
          headers: {
              Accept: "application/json; odata=verbose",
              "Content-Type": "application/json;odata=verbose"
          }
      });
        call.done(function (data, textStatus, jqXHR) {          
            $('#locations li').remove();
            var orderedList = $('#locations');
            allLocations = data.d.results;
            $.each(data.d.results, function (idx, elem) {
                orderedList.append("<div class='col-md-3'><div class='col-md-12' style='margin-bottom: 7%; font-weight:bold;'>"+elem.Title+"</div><div class='col-md-12'><li><button type='button' class='btn btn-primary' id='" + elem.ID + "'><i class='fa fa-thumbs-up fa-2x dscicon' id='icon"+ elem.ID +"'></button></li></div></div>");
               // orderedList.append("<div class='col-md-3'><li><button type='button' class='btn btn-primary' id='" + elem.ID + "'><i class='fa fa-thumbs-up fa-2x'></button></li></div>");
             //  allLocations.push(elem.title);
             //myPieChart.labels.push();
            });
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
       //   alert("fail dattaaa");
            var response = JSON.parse(jqXHR.responseText);
            var message = response ? response.error.message.value : textStatus;
            alert("Call hutch failed. Error: " + message);
        });
      }
      /******************Populating trip locaions*******************/
          
        /***************For First Time**********************/
        $(document).on("click", ".btn-primary" , function() {
          alert("dasdda");
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

         /**************Pie Chart*************/
       // var ctxP = document.getElementById("pieChart").getContext('2d');
       var myPieChart = new Chart(cntxt, {
        type: 'pie',
        data: {
          labels: ["Red", "Green", "Yellow", "Grey", "Dark Grey"],
            datasets: [
                {
                    data: [300, 50, 100, 40, 120],
                    backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1"],   //"#4D5360"
                    hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#A8B3C5", "#616774"]
                }
            ]
        },
        options: {
            responsive: true
        }
    });

    /*************another approach***********/
  //  var chartdata = [
  //     {
  //       label: "hello",
  //       color: "#F7464A",
  //       highlight: "#F7464A",
  //       value: 10
  //     },
  //     {
  //       label: "Bye",
  //       color:  "#46BFBD",
  //       highlight: "#46BFBD",
  //       value: 20
  //     },
  //     {
  //       label: "Enough",
  //       color: "#949FB1",
  //       highlight: "#949FB1",
  //       value: 10
  //     }
  //   ];

   //var piecharter =  new Chart(cntxt).pie(chartdata);
    /*************another approach***********/


    /**************Pie Chart*************/

   

      });

     this.OnSubmitClick();
  }

  OnSubmitClick()
  {
    this.domElement.querySelector(".btn-success").addEventListener('click',() => this.saveChangesToList());
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

    alert("coming in savechanges Id Trip:"+ selectedTrip);
    if (Environment.type === EnvironmentType.Local) {
      this.domElement.querySelector('#listdata').innerHTML = "Sorry this does not work in local workbench";
    } 
    else{
      if(selectedTrip == null || selectedTrip == '' || selectedTrip == isEmpty)
      {
        alert("Please Select Location");
      }
      else
      {
        if(isVoted == null || isVoted == '' || isVoted == isEmpty)
        {
          alert("if :"+selectedTrip);
          pnp.sp.web.lists.getByTitle('DscVoting').items.add({ Title :'Inserted',LocationId : selectedTrip}); 
          alert("Inserted Successfully!!!");
        
        }
        else
        {
         // alert("else :"+selectedTrip);
          alert("record to update :"+updateId);
          pnp.sp.web.lists.getByTitle('DscVoting').items.getById(parseInt(updateId)).update({Title :'Updated',LocationId : selectedTrip});
          alert("Updated Successfully!!!");
        }
      }      
    }
  }
}
