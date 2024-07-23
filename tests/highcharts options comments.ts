const chartOptions = {
    title: {
        text: 'Historic World Population by Region',
        align: 'left'
    },
    chart: {
        type: 'bar'
    },
    plotOptions: {
        bar: {
            borderRadius: '50%',
            dataLabels: {
                enabled: true
            },
            groupPadding: 0.1 // Menor padding más ancho el bar
        }
    },
    xAxis: {
        categories: ['Africa', 'America', 'Asia', 'Europe'],
        // title: {
        //     text: null
        // },
        gridLineWidth: 1, // Por defecto no se ve
        lineWidth: 0
    },
    yAxis: {
        // min: 0,
        title: {
            text: 'Population (millions)',
            align: 'high'
        },
        labels: { // Por investigar
            overflow: 'justify'
        },
        // gridLineWidth: 0 // Por defecto se ve
    },
    series: [{
        name: "Year 1990",
        data: [631, 727, 3202, 721]
    }]
}