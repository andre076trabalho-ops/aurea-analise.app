import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Upload, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const colorPresets = [
  { name: 'Emerald', primary: '#10b981', secondary: '#1e293b' },
  { name: 'Blue', primary: '#3b82f6', secondary: '#1e293b' },
  { name: 'Orange', primary: '#f97316', secondary: '#1c1917' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#1c1917' },
  { name: 'Violet', primary: '#8b5cf6', secondary: '#1e1b4b' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#134e4a' },
];

export default function BrandKitPage() {
  const { brandKit, updateBrandKit } = useAppStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    updateBrandKit({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    });
  };

  return (
    <MainLayout>
      <Header 
        title="Brand Kit" 
        subtitle="Configure a identidade visual dos seus relatórios"
      />
      
      <div className="p-6 max-w-4xl">
        <div className="space-y-8">
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Logo</h3>
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/30">
                {brandKit.logoUrl ? (
                  <img 
                    src={brandKit.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Palette className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>URL do Logo</Label>
                  <Input 
                    value={brandKit.logoUrl || ''}
                    onChange={(e) => updateBrandKit({ logoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button variant="secondary" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Fazer Upload
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Colors Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Cores</h3>
            
            {/* Presets */}
            <div className="mb-6">
              <Label className="text-muted-foreground mb-3 block">Presets</Label>
              <div className="flex flex-wrap gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                      brandKit.primaryColor === preset.primary
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div 
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span className="text-sm">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandKit.primaryColor}
                    onChange={(e) => updateBrandKit({ primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                  />
                  <Input 
                    value={brandKit.primaryColor}
                    onChange={(e) => updateBrandKit({ primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Cor Secundária</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandKit.secondaryColor}
                    onChange={(e) => updateBrandKit({ secondaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                  />
                  <Input 
                    value={brandKit.secondaryColor}
                    onChange={(e) => updateBrandKit({ secondaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Cor Neutra</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandKit.neutralColor}
                    onChange={(e) => updateBrandKit({ neutralColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                  />
                  <Input 
                    value={brandKit.neutralColor}
                    onChange={(e) => updateBrandKit({ neutralColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Typography & Style */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Tipografia & Estilo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Fonte</Label>
                <Select 
                  value={brandKit.font} 
                  onValueChange={(v) => updateBrandKit({ font: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Estilo do Relatório</Label>
                <Select 
                  value={brandKit.style} 
                  onValueChange={(v: 'clean' | 'premium') => updateBrandKit({ style: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Preview do Relatório</h3>
            
            <div 
              className="aspect-[8.5/11] rounded-xl border border-border overflow-hidden"
              style={{ backgroundColor: brandKit.secondaryColor }}
            >
              {/* Mock PDF Preview */}
              <div className="h-full flex flex-col">
                {/* Cover */}
                <div 
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  style={{ fontFamily: brandKit.font }}
                >
                  {brandKit.logoUrl ? (
                    <img 
                      src={brandKit.logoUrl} 
                      alt="Logo" 
                      className="w-24 h-24 object-contain mb-6"
                    />
                  ) : (
                    <div 
                      className="w-24 h-24 rounded-xl mb-6 flex items-center justify-center"
                      style={{ backgroundColor: brandKit.primaryColor }}
                    >
                      <Palette className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <h2 
                    className="text-2xl font-bold mb-2"
                    style={{ color: brandKit.primaryColor }}
                  >
                    Relatório de Auditoria
                  </h2>
                  <p className="text-white/60">Presença Digital</p>
                  <p className="text-white/40 text-sm mt-4">Cliente Exemplo</p>
                  <p className="text-white/40 text-sm">Janeiro 2024</p>
                </div>

                {/* Footer */}
                <div 
                  className="py-3 px-6 text-center text-xs"
                  style={{ 
                    backgroundColor: brandKit.primaryColor,
                    color: 'white'
                  }}
                >
                  Sua Empresa • www.suaempresa.com
                </div>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2 min-w-32">
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Salvo!
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
