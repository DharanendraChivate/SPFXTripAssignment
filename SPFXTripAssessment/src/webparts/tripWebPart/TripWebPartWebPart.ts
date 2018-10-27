import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';
import { SPComponentLoader } from '@microsoft/sp-loader';
import 'jquery';
import styles from './TripWebPartWebPart.module.scss';
import * as strings from 'TripWebPartWebPartStrings';
require ('bootstrap');
export interface ITripWebPartWebPartProps {
  description: string;
}

export default class TripWebPartWebPart extends BaseClientSideWebPart<ITripWebPartWebPartProps> {

  public render(): void {
    let cssURL = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css";
    let fontUrl = "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css";
    SPComponentLoader.loadCss(cssURL);
    SPComponentLoader.loadCss(fontUrl);
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


      <div class="container col-md-12">
        <div class="row">
          <div class="container text-center col-md-12">
            <h1 style="padding-bottom: 5%;">Trip Spots/Location</h1>      
              <ul class="list-inline" id="locations">
              </ul>
              
              <button type="button" class="btn btn-success" style="margin-top: 5%;">Submit</button>
          </div>
        <div>
      </div>
      `;
      var Absourl = this.context.pageContext.web.absoluteUrl;
      $(document).ready(function()
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
            $.each(data.d.results, function (idx, elem) {
                orderedList.append("<div class='col-md-3'><div class='col-md-12' style='margin-bottom: 7%; font-weight:bold;'>"+elem.Title+"</div><div class='col-md-12'><li><button type='button' class='btn btn-primary' id='" + elem.ID + "'><i class='fa fa-thumbs-up fa-2x'></button></li></div></div>");
               // orderedList.append("<div class='col-md-3'><li><button type='button' class='btn btn-primary' id='" + elem.ID + "'><i class='fa fa-thumbs-up fa-2x'></button></li></div>");
              
            });
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
       //   alert("fail dattaaa");
            var response = JSON.parse(jqXHR.responseText);
            var message = response ? response.error.message.value : textStatus;
            alert("Call hutch failed. Error: " + message);
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
}
