
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Activity } from "lucide-react";

const CEOAnalytics = () => {
  const analyticsData = [
    {
      title: "Revenue Growth",
      value: "$342,891",
      change: "+18.2%",
      trend: "up",
      period: "vs last quarter",
      chart: [65, 72, 68, 75, 82, 78, 85, 91, 88, 94, 97, 89]
    },
    {
      title: "Customer Acquisition",
      value: "1,247",
      change: "+24.1%",
      trend: "up",
      period: "vs last quarter",
      chart: [23, 28, 31, 35, 42, 38, 45, 52, 48, 56, 61, 58]
    },
    {
      title: "Operating Expenses",
      value: "$127,456",
      change: "-8.3%",
      trend: "down",
      period: "vs last quarter",
      chart: [85, 82, 78, 75, 71, 68, 65, 62, 58, 55, 52, 48]
    },
    {
      title: "Employee Satisfaction",
      value: "4.7/5",
      change: "+0.3",
      trend: "up",
      period: "vs last quarter",
      chart: [4.2, 4.3, 4.1, 4.4, 4.5, 4.3, 4.6, 4.7, 4.5, 4.8, 4.7, 4.7]
    }
  ];

  const departmentAnalytics = [
    { department: "Marketing", revenue: 125000, growth: 15.2, efficiency: 87, roi: 245 },
    { department: "Sales", revenue: 189000, growth: 22.1, efficiency: 92, roi: 312 },
    { department: "Operations", revenue: 0, growth: 0, efficiency: 78, roi: 0, cost: 45000 },
    { department: "HR", revenue: 0, growth: 0, efficiency: 85, roi: 0, cost: 32000 }
  ];

  const getChartColor = (trend: string) => {
    return trend === 'up' ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Deep insights into company performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Data</Button>
          <Button>Generate Report</Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsData.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{metric.period}</p>
                </div>
                <div className="w-20 h-12 flex items-end gap-1">
                  {metric.chart.map((value, i) => (
                    <div
                      key={i}
                      className={`w-1 ${getChartColor(metric.trend)} opacity-70`}
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance Analysis</CardTitle>
          <CardDescription>Comparative analysis across all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentAnalytics.map((dept, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{dept.department}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      {dept.revenue > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">Revenue</p>
                          <p className="font-semibold">${dept.revenue.toLocaleString()}</p>
                        </div>
                      )}
                      {dept.cost && (
                        <div>
                          <p className="text-xs text-gray-500">Operating Cost</p>
                          <p className="font-semibold">${dept.cost.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Efficiency</p>
                        <p className="font-semibold">{dept.efficiency}%</p>
                      </div>
                      {dept.growth > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">Growth</p>
                          <p className="font-semibold text-green-600">+{dept.growth}%</p>
                        </div>
                      )}
                      {dept.roi > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">ROI</p>
                          <p className="font-semibold text-blue-600">{dept.roi}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Position</CardTitle>
            <CardDescription>Competitive analysis and market share</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Market Share</span>
                <Badge variant="default">12.4%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '12.4%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Competitive Ranking</span>
                <Badge variant="secondary">#3</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Brand Recognition</span>
                    <span className="text-green-600">+8.2%</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Customer Loyalty</span>
                    <span className="text-green-600">+5.7%</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Price Competitiveness</span>
                    <span className="text-blue-600">+2.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Projections</CardTitle>
            <CardDescription>Next quarter forecasts and targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Projected Revenue</p>
                  <p className="text-lg font-bold text-blue-600">$425K</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Growth Target</p>
                  <p className="text-lg font-bold text-green-600">+25%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Q2 Revenue Goal</span>
                  <span className="text-sm font-medium">$400,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <p className="text-xs text-gray-500">78% on track to meet target</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CEOAnalytics;
