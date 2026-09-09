
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, Calendar, TrendingUp, Users, DollarSign } from "lucide-react";

const CEOPlanning = () => {
  const [initiatives, setInitiatives] = useState([
    {
      id: 1,
      title: "Digital Transformation Initiative",
      description: "Modernize all customer-facing systems and internal processes",
      priority: "High",
      status: "In Progress",
      timeline: "Q2-Q4 2024",
      budget: 150000,
      owner: "IT Department",
      progress: 35,
      kpis: ["System Uptime: 99.9%", "User Satisfaction: 4.5/5", "Process Efficiency: +40%"]
    },
    {
      id: 2,
      title: "Market Expansion Strategy",
      description: "Expand into three new regional markets",
      priority: "High",
      status: "Planning",
      timeline: "Q3 2024",
      budget: 200000,
      owner: "Marketing",
      progress: 15,
      kpis: ["New Markets: 3", "Customer Base: +50%", "Revenue Growth: +30%"]
    },
    {
      id: 3,
      title: "Sustainability Program",
      description: "Implement comprehensive environmental sustainability practices",
      priority: "Medium",
      status: "Planning",
      timeline: "Q1-Q2 2024",
      budget: 75000,
      owner: "Operations",
      progress: 8,
      kpis: ["Carbon Footprint: -25%", "Waste Reduction: 40%", "Cost Savings: $30K"]
    }
  ]);

  const [newInitiative, setNewInitiative] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    timeline: '',
    budget: '',
    owner: ''
  });

  const quarterlyGoals = [
    {
      quarter: "Q2 2024",
      revenue: 450000,
      customers: 2800,
      growth: 22,
      initiatives: 5
    },
    {
      quarter: "Q3 2024",
      revenue: 520000,
      customers: 3200,
      growth: 28,
      initiatives: 7
    },
    {
      quarter: "Q4 2024",
      revenue: 600000,
      customers: 3800,
      growth: 35,
      initiatives: 8
    }
  ];

  const addInitiative = () => {
    if (newInitiative.title && newInitiative.description) {
      setInitiatives([...initiatives, {
        id: Date.now(),
        ...newInitiative,
        status: 'Planning',
        progress: 0,
        budget: parseInt(newInitiative.budget) || 0,
        kpis: []
      }]);
      setNewInitiative({
        title: '',
        description: '',
        priority: 'Medium',
        timeline: '',
        budget: '',
        owner: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Strategic Planning</h2>
          <p className="text-gray-600">Long-term goals and strategic initiatives</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Initiative
        </Button>
      </div>

      {/* Planning Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Initiatives</p>
                <p className="text-2xl font-bold">{initiatives.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(initiatives.reduce((sum, i) => sum + i.progress, 0) / initiatives.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">
                  ${initiatives.reduce((sum, i) => sum + i.budget, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Milestone</p>
                <p className="text-2xl font-bold">Q2 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Initiatives</CardTitle>
          <CardDescription>
            Track progress of major company initiatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {initiatives.map((initiative) => (
              <div key={initiative.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-lg">{initiative.title}</h4>
                      <Badge variant={initiative.priority === 'High' ? 'destructive' : 'default'}>
                        {initiative.priority}
                      </Badge>
                      <Badge variant="outline">{initiative.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{initiative.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Timeline:</span>
                        <p className="font-medium">{initiative.timeline}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <p className="font-medium">${initiative.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Owner:</span>
                        <p className="font-medium">{initiative.owner}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Progress:</span>
                        <p className="font-medium">{initiative.progress}%</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{initiative.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${initiative.progress}%` }}
                    ></div>
                  </div>
                </div>

                {initiative.kpis.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Key Performance Indicators</h5>
                    <div className="flex gap-2 flex-wrap">
                      {initiative.kpis.map((kpi, index) => (
                        <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {kpi}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Goals</CardTitle>
          <CardDescription>
            Revenue and growth targets for upcoming quarters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quarterlyGoals.map((goal, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3">{goal.quarter}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue Target</span>
                    <span className="font-medium">${goal.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Customer Goal</span>
                    <span className="font-medium">{goal.customers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Growth Target</span>
                    <span className="font-medium text-green-600">+{goal.growth}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Initiatives</span>
                    <span className="font-medium">{goal.initiatives}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Initiative Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Initiative</CardTitle>
          <CardDescription>
            Create a new strategic initiative
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newInitiative.title}
                onChange={(e) => setNewInitiative({...newInitiative, title: e.target.value})}
                placeholder="Initiative title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Owner</label>
              <Input
                value={newInitiative.owner}
                onChange={(e) => setNewInitiative({...newInitiative, owner: e.target.value})}
                placeholder="Department or person responsible"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newInitiative.description}
                onChange={(e) => setNewInitiative({...newInitiative, description: e.target.value})}
                placeholder="Detailed description of the initiative"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Timeline</label>
              <Input
                value={newInitiative.timeline}
                onChange={(e) => setNewInitiative({...newInitiative, timeline: e.target.value})}
                placeholder="e.g., Q2-Q3 2024"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Budget</label>
              <Input
                type="number"
                value={newInitiative.budget}
                onChange={(e) => setNewInitiative({...newInitiative, budget: e.target.value})}
                placeholder="Budget amount"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={addInitiative}>
              Add Initiative
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CEOPlanning;
