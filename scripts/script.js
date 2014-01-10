/**
 * Created by Sebastian on 11/1/13.
 */
function run(){
    FB.login(afterlogin,{scope: 'user_events'} )
}

function afterlogin(response){
    console.log("Success!");
    FB.api('/me', {fields: 'events'}, eventslistFB );
}

function eventslistFB(response){
    //This function exists exclusively to cut a layer of the response object provided by FB.api
    //So we can universalize the eventslist function to work with FB's pagination system.
    eventslist(response.events);
}
function eventslist(eventsObject) {
    //Clear most of the page and replace it with the new display data from our latest api call (pagination or button)

    console.log(eventsObject);
    $(".emptyonload").empty();
    for (var i = 0; i < eventsObject.data.length; i++) {
        element = eventsObject.data[i];
        console.log(element.name);
        $("#list").append("<a onclick=\"searchEvent("+ element.id + ")\" href=#>"+ element.name + "</a><br />");
    }

    //We define the print functions as children so we can keep access to the eventsObject
    function printPrev(res){
        if(res.data.length > 0){
            $("#prevbutton").append("<a onclick=\"$.get('"+eventsObject.paging.previous+"', eventslist)\" href=#>Previous</a>");
        }
    }
    function printNext(res){
        if(res.data.length > 0){
            $("#nextbutton").append("<a onclick=\"$.get('"+eventsObject.paging.next+"', eventslist)\" href=#>Next</a>");
        }
    }
    //FB doesn't tell you if the next "pages" have data, so we need to check ourselves whether they exist.
    $.get(eventsObject.paging.previous, printPrev)
    $.get(eventsObject.paging.next, printNext)

}

function searchEvent(id){
    FB.api("/"+id.toString(), {fields: 'attending.fields(gender,last_name),description,name,owner,parent_group,cover'}, eventDisplay);
}

function eventDisplay(data){
    console.log("WE GOT DA DATA");
    console.log(data);
    $("#eventdisplay").empty();
    $("#eventdisplay").append("<h2>"+data.name+"</h1>");
    $("#eventdisplay").append("<h4>"+data.owner.name+"</h4>");
    $("#eventdisplay").append("<h4>"+data.attending.data.length.toString()+"</h4>");
    var male = 0;
    var female = 0;
    var total = 0;
    for (var i = 0; i < data.attending.data.length; i++){
        element = data.attending.data[i];
        if (element.gender == "male") {
            male++;
        }else{
            female++;
        }
        total++;
    }
    var malesperfemale = male/female;
    var femalespermale = female/male;
    
    //Handle making a graphic with d3
    var svg = d3.select("#eventdisplay").append("svg").attr("width", "400").attr("height", "400");
    var arc = d3.svg.arc()
    .outerRadius(150)
    .innerRadius(0);
    
    var colors = ["#FF0000", "#0000FF"];
    var pie = d3.layout.pie().value(function(d) { return d.value;});

    malesandfemales = [male, female]
    svg.append("g").attr("class", "donut");
    svg.select(".donut")
        .append("g")
        .data(pie(malesandfemales))
        .append("path")
        .attr("d", arc);
    


    $("#eventdisplay").append("There are <strong>"+male+" males</strong> attending and <strong>"+female+" females</strong>, leading to a ratio of <strong>"+ malesperfemale+" males per female</strong> or <strong>"+femalespermale+" females per male</strong>.");


}
