import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Shield, FileCheck, Scale, Building2, Languages, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ComplianceFramework {
  name: string;
  description: string;
  required: boolean;
}

interface DocumentType {
  type: string;
  description: string;
  required: boolean;
}

interface ScoringMethodology {
  name: string;
  description: string;
}

interface GovernmentIntegration {
  name: string;
  description: string;
}

interface CountryComplianceInfo {
  id: string;
  countryCode: string;
  countryName: string;
  region: string;
  status: string;
  description: string;
  complianceFrameworks: ComplianceFramework[];
  documentTypes: DocumentType[];
  scoringMethodologies: ScoringMethodology[];
  governmentIntegrations: GovernmentIntegration[];
  languages: string[];
  keyFeatures: string[];
}

export default function ComplianceExplorerPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  useEffect(() => {
    document.title = "Compliance Explorer - GLOBAL-TVS";
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Explore country-specific procurement compliance requirements. View regulations, document types, and scoring methodologies for Africa, Middle East, and beyond.');
  }, []);

  const { data: countries, isLoading: loadingCountries } = useQuery<CountryComplianceInfo[]>({
    queryKey: ["/api/compliance/countries"],
  });

  const { data: countryDetails, isLoading: loadingDetails } = useQuery<CountryComplianceInfo>({
    queryKey: ["/api/compliance/countries", selectedCountry],
    enabled: !!selectedCountry,
  });

  const selectedCountryData = countryDetails || countries?.find(c => c.countryCode === selectedCountry);

  const regionGroups = countries?.reduce((acc, country) => {
    const region = country.region || "Other";
    if (!acc[region]) acc[region] = [];
    acc[region].push(country);
    return acc;
  }, {} as Record<string, CountryComplianceInfo[]>) || {};

  return (
    <div className="min-h-screen bg-background" data-testid="page-compliance-explorer">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4" data-testid="badge-explorer">
              <Globe className="w-3 h-3 mr-1" />
              Country Compliance Explorer
            </Badge>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-explorer-title">
              Find Your Country's Compliance Requirements
            </h1>
            <p className="text-lg text-muted-foreground mb-6" data-testid="text-explorer-subtitle">
              GLOBAL-TVS supports procurement compliance for countries worldwide. Select your country to see 
              the specific regulations, document types, and scoring methodologies we verify.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-full sm:w-80">
                <Select value={selectedCountry} onValueChange={setSelectedCountry} data-testid="select-country">
                  <SelectTrigger data-testid="select-country-trigger">
                    <SelectValue placeholder="Select a country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(regionGroups).map(([region, regionCountries]) => (
                      <div key={region}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">{region}</div>
                        {regionCountries.map((country) => (
                          <SelectItem 
                            key={country.countryCode} 
                            value={country.countryCode}
                            data-testid={`select-item-${country.countryCode}`}
                          >
                            {country.countryName}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!selectedCountry && (
                <p className="text-sm text-muted-foreground">
                  Don't see your country? We support <strong>any country</strong> with our Global compliance framework.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!selectedCountry ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="country-cards-grid">
            {countries?.filter(c => c.countryCode !== "GLOBAL").map((country) => (
              <Card 
                key={country.countryCode} 
                className="cursor-pointer hover-elevate transition-all"
                onClick={() => setSelectedCountry(country.countryCode)}
                data-testid={`card-country-${country.countryCode}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{country.countryName}</CardTitle>
                    <Badge variant="outline" className="text-xs">{country.region}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {country.description || `Compliance verification for ${country.countryName}`}
                  </p>
                  {Array.isArray(country.keyFeatures) && country.keyFeatures.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {country.keyFeatures.slice(0, 2).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {typeof feature === 'string' ? feature.split(' ').slice(0, 2).join(' ') : ''}
                        </Badge>
                      ))}
                      {country.keyFeatures.length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{country.keyFeatures.length - 2}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div data-testid="country-details-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-country-name">
                  {selectedCountryData?.countryName}
                </h2>
                <p className="text-muted-foreground" data-testid="text-country-region">
                  {selectedCountryData?.region}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelectedCountry("")} data-testid="button-back">
                View All Countries
              </Button>
            </div>

            {selectedCountryData?.description && (
              <Card className="mb-6" data-testid="card-country-description">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">{selectedCountryData.description}</p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="frameworks" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5" data-testid="tabs-list">
                <TabsTrigger value="frameworks" data-testid="tab-frameworks">
                  <Shield className="w-4 h-4 mr-2" />
                  Frameworks
                </TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="scoring" data-testid="tab-scoring">
                  <Scale className="w-4 h-4 mr-2" />
                  Scoring
                </TabsTrigger>
                <TabsTrigger value="integrations" data-testid="tab-integrations">
                  <Building2 className="w-4 h-4 mr-2" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="features" data-testid="tab-features">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Features
                </TabsTrigger>
              </TabsList>

              <TabsContent value="frameworks" data-testid="content-frameworks">
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Frameworks</CardTitle>
                    <CardDescription>
                      Regulatory frameworks and standards we verify for {selectedCountryData?.countryName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(selectedCountryData?.complianceFrameworks) && selectedCountryData.complianceFrameworks.length > 0 ? (
                      <div className="grid gap-4">
                        {selectedCountryData.complianceFrameworks.map((framework, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-start gap-4 p-4 rounded-lg border"
                            data-testid={`framework-item-${idx}`}
                          >
                            <div className={`p-2 rounded-full ${framework.required ? 'bg-primary/10' : 'bg-muted'}`}>
                              <Shield className={`w-5 h-5 ${framework.required ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{framework.name}</h4>
                                {framework.required && (
                                  <Badge variant="default" className="text-xs">Required</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{framework.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No specific frameworks configured. Global standards apply.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" data-testid="content-documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Types Verified</CardTitle>
                    <CardDescription>
                      Documents we can process and verify for {selectedCountryData?.countryName} procurement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(selectedCountryData?.documentTypes) && selectedCountryData.documentTypes.length > 0 ? (
                      <div className="grid gap-3">
                        {selectedCountryData.documentTypes.map((doc, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 rounded-lg border"
                            data-testid={`document-item-${idx}`}
                          >
                            <div className="flex items-center gap-3">
                              <FileCheck className={`w-5 h-5 ${doc.required ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <p className="font-medium">{doc.type}</p>
                                <p className="text-sm text-muted-foreground">{doc.description}</p>
                              </div>
                            </div>
                            <Badge variant={doc.required ? "default" : "outline"}>
                              {doc.required ? "Required" : "Optional"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Standard document types supported.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scoring" data-testid="content-scoring">
                <Card>
                  <CardHeader>
                    <CardTitle>Scoring Methodologies</CardTitle>
                    <CardDescription>
                      Bid evaluation and scoring methods used in {selectedCountryData?.countryName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(selectedCountryData?.scoringMethodologies) && selectedCountryData.scoringMethodologies.length > 0 ? (
                      <div className="grid gap-4">
                        {selectedCountryData.scoringMethodologies.map((method, idx) => (
                          <div 
                            key={idx} 
                            className="p-4 rounded-lg border"
                            data-testid={`scoring-item-${idx}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Scale className="w-5 h-5 text-primary" />
                              <h4 className="font-semibold">{method.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Standard technical and financial scoring methodology.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" data-testid="content-integrations">
                <Card>
                  <CardHeader>
                    <CardTitle>Government Integrations</CardTitle>
                    <CardDescription>
                      Government systems and databases we integrate with for {selectedCountryData?.countryName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(selectedCountryData?.governmentIntegrations) && selectedCountryData.governmentIntegrations.length > 0 ? (
                      <div className="grid gap-3">
                        {selectedCountryData.governmentIntegrations.map((integration, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-3 p-3 rounded-lg border"
                            data-testid={`integration-item-${idx}`}
                          >
                            <Building2 className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">{integration.name}</p>
                              <p className="text-sm text-muted-foreground">{integration.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">API integrations available upon request.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" data-testid="content-features">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Features</CardTitle>
                      <CardDescription>
                        What GLOBAL-TVS offers for {selectedCountryData?.countryName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(selectedCountryData?.keyFeatures) && selectedCountryData.keyFeatures.length > 0 ? (
                        <ul className="space-y-3">
                          {selectedCountryData.keyFeatures.map((feature, idx) => (
                            <li 
                              key={idx} 
                              className="flex items-start gap-2"
                              data-testid={`feature-item-${idx}`}
                            >
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">All standard features available.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Supported Languages</CardTitle>
                      <CardDescription>
                        Document processing languages
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedCountryData?.languages) && selectedCountryData.languages.length > 0 ? (
                          selectedCountryData.languages.map((lang, idx) => (
                            <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                              <Languages className="w-3 h-3" />
                              {lang}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            English
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <Card className="mt-8 bg-primary/5 border-primary/20" data-testid="card-cta">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">Ready to get started in {selectedCountryData?.countryName}?</h3>
                    <p className="text-muted-foreground">
                      Start verifying bids and documents with GLOBAL-TVS today.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link href="/pricing">
                      <Button variant="outline" data-testid="button-view-pricing">View Pricing</Button>
                    </Link>
                    <Button data-testid="button-get-started">Get Started</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
