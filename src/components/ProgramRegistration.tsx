
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProgramRegistrationForm from './ProgramRegistrationForm';
import { getPrograms } from '@/services/dataService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { getAvailablePrograms } from '@/services/calendarService';

const ProgramRegistration = () => {
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { programId } = useParams();

  useEffect(() => {
    const loadProgram = async () => {
      try {
        // Get available programs from calendar events
        const availablePrograms = await getAvailablePrograms();
        
        if (programId && availablePrograms.length > 0) {
          const foundProgram = availablePrograms.find((p: any) => p.id === programId);
          if (foundProgram) {
            setProgram(foundProgram);
            console.log("Found program:", foundProgram);
          } else {
            console.log("Program not found with ID:", programId);
          }
        }
      } catch (error) {
        console.error('Error loading program:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgram();
  }, [programId]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {program && (
              <Card>
                <CardHeader>
                  <CardTitle>{program.title}</CardTitle>
                  <CardDescription>
                    {program.date} • {program.time}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            <ProgramRegistrationForm programId={programId} />
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ProgramRegistration;
