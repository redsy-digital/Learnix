/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  Sparkles,
  BookOpen,
  FileText,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle,
  Users,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Brain,
  Zap,
  Flame,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const benefits = [
    {
      title: 'IA Assistente Académica',
      description: 'Estuda com um tutor alimentado por inteligência artificial, capaz de gerar exercícios personalizados e explicar as respostas passo a passo.',
      icon: Brain,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Historial de Conteúdos',
      description: 'Guarda as matérias aprendidas em sala de aula manualmente ou tirando fotos aos teus cadernos, criando uma base duradoura de estudo.',
      icon: FileText,
      color: 'from-violet-500 to-purple-500'
    },
    {
      title: 'Metas e Evolução',
      description: 'Visualiza gráficos do teu rendimento escolar, as tuas médias e cria metas desafiantes para garantir o teu progresso em cada disciplina.',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Agenda Virtual Integrada',
      description: 'Organiza o teu horário semanal e planeia as tuas avaliações em poucos minutos para nunca te atrasares nos trabalhos e exames.',
      icon: Calendar,
      color: 'from-amber-500 to-orange-500'
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Regista as Matérias',
      subtitle: 'Tira uma foto ao teu caderno ou escreve diretamente o sumário da aula. O Learnix processa as tuas anotações instantaneamente.'
    },
    {
      num: '02',
      title: 'Visualiza o teu Desempenho',
      subtitle: 'O nosso painel calcula as tuas médias ponderadas, as tuas notas atuais e assinala quais são as disciplinas que precisam de maior atenção.'
    },
    {
      num: '03',
      title: 'Gera Exercícios Inteligentes',
      subtitle: 'A inteligência artificial lê os teus conteúdos de estudo recentes e cria mini testes e perguntas de escolha múltipla para reteres a matéria.'
    }
  ];

  const testimonials = [
    {
      name: 'Beatriz Almeida',
      role: 'Estudante do 11º Ano',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
      comment: 'O Learnix mudou a minha rotina de estudo. Consigo tirar foto aos resumos de Biologia e depois a IA gera perguntas exatamente iguais às do teste nacional!'
    },
    {
      name: 'Diogo Moreira',
      role: 'Estudante do 12º Ano',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
      comment: 'Estava com dificuldades para manter a média de Matemática acima de 16 para concorrer à universidade. Com as estatísticas e as metas do Learnix, agora sei onde focar!'
    },
    {
      name: 'Inês Santos',
      role: 'Estudante do 10º Ano',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      comment: 'Amei o sistema do horário integrado! Saber que a plataforma me dá metas concretas diárias mantém-me motivada todos os dias. Os meus pais adoraram o resultado!'
    }
  ];

  const faqs = [
    {
      q: 'Como funciona a geração de exercícios por Inteligência Artificial?',
      a: 'O Learnix analisa o título, a descrição e as observações de estudo que guardas no sistema. Com base nisso, ele cria autonomamente testes de escolha múltipla, problemas práticos e perguntas de resposta aberta sob medida para testar os teus conhecimentos.'
    },
    {
      q: 'Posso usar a câmara para carregar conteúdos?',
      a: 'Sim! Na aba de Conteúdos podes carregar uma imagem do teu caderno físico ou livro escolar. O nosso motor faz a simulação OCR para registrar os Textos principais diretamente no teu fichário inteligente.'
    },
    {
      q: 'O Learnix segue o programa escolar oficial?',
      a: 'A nossa IA foi desenhada de forma universal, permitindo-te registar disciplinas como Matemática, Física, Biologia, Línguas e Ciências Sociais de qualquer ano escolar e currículo académico.'
    },
    {
      q: 'A plataforma é gratuita para os estudantes?',
      a: 'Sim, o plano básico do Learnix é totalmente gratuito e conta com registro de disciplinas, agenda, notas e simulações básicas de Inteligência Artificial para facilitar o acesso à educação inteligente.'
    }
  ];

  const handleQuickLogin = () => {
    navigate('/login');
  };

  return (
    <div className="bg-white min-h-screen selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navbar bar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Learnix</span>
              <p className="text-[9px] -mt-1 font-semibold text-slate-400 tracking-widest uppercase">Estudo Inteligente</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#beneficios" className="hover:text-blue-600 transition">Benefícios</a>
            <a href="#como-funciona" className="hover:text-blue-600 transition">Como Funciona</a>
            <a href="#funcionalidades" className="hover:text-blue-600 transition">Funcionalidades</a>
            <a href="#perguntas" className="hover:text-blue-600 transition">FAQ</a>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 py-2 transition"
            >
              Entrar
            </Link>
            <button
              onClick={handleQuickLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-100 transition whitespace-nowrap cursor-pointer"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-slate-50">
        {/* Background blobs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-r from-blue-200/20 to-violet-200/20 rounded-full filter blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold w-fit animate-pulse">
              <Sparkles size={13} className="text-blue-500 fill-blue-500" />
              <span>Plataforma Académica de Nova Geração</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-none">
              Learn smarter,<br />
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">grow faster.</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              Learnix é o teu companheiro educacional com IA. Regista as matérias das aulas, monitoriza as tuas avaliações em tempo real e utiliza algoritmos avançados para gerar testes interativos personalizados.
            </p>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <Link
                to="/login"
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-100 hover:shadow-xl transition text-base"
              >
                <span>Criar Conta Gratuita</span>
                <ArrowRight size={18} />
              </Link>
              <button
                onClick={handleQuickLogin}
                className="flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-xl transition text-base"
              >
                <span>Demonstração Rápida</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200/60 max-w-md">
              <div>
                <p className="font-display text-3xl font-bold text-slate-900">100%</p>
                <p className="text-xs font-semibold text-slate-500">Privado & Seguro</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-slate-900">+4.8★</p>
                <p className="text-xs font-semibold text-slate-500">Avaliação do Alunos</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-slate-900">{`>10`}</p>
                <p className="text-xs font-semibold text-slate-500">Disciplinas Clássicas</p>
              </div>
            </div>
          </div>

          {/* Interactive preview box */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 relative overflow-hidden">
              {/* Header bar simulated */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  learnix.app/dashboard
                </div>
              </div>

              {/* simulated app screen */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Olá, Pedro! 👋</h3>
                    <p className="text-[10px] text-slate-500">Pronto para a sessão de estudo de hoje?</p>
                  </div>
                  <div className="bg-amber-100 text-amber-700 text-[10px] font-extrabold px-2 py-1 rounded-full flex items-center space-x-1">
                    <Flame size={12} className="fill-amber-500 text-amber-500" />
                    <span>6 Dias</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-tr from-blue-50 to-blue-100/55 p-3 rounded-2xl border border-blue-100/40">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Média Geral</p>
                    <p className="text-2xl font-bold text-blue-600">16.2 <span className="text-[10px] text-slate-400">/20</span></p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '81%' }}></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-tr from-violet-50 to-violet-100/55 p-3 rounded-2xl border border-violet-100/40">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Meta Concluída</p>
                    <p className="text-2xl font-bold text-violet-600">75%</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-violet-600 h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Simulated AI box questions */}
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-violet-700 text-xs font-bold">
                    <Brain size={14} />
                    <span>Resolvido com IA</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 leading-tight">
                    "Determine a derivada da função f(x) = (3x² + 2)⁵..."
                  </p>
                  <div className="flex space-x-2 pt-1">
                    <div className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Correto +16.4v
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">
                      Matemática 11º Ano
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Float badge 1 */}
            <div className="absolute -top-6 -right-6 bg-white border border-slate-100 shadow-xl p-3.5 rounded-2xl flex items-center space-x-3 max-w-xs animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle size={16} />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">Nota 17.5 em Química!</p>
                <p className="text-[10px] text-slate-500">Superou a meta semanal</p>
              </div>
            </div>

            {/* Float badge 2 */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-slate-100 shadow-xl p-3.5 rounded-2xl flex items-center space-x-3 max-w-xs animate-bounce" style={{ animationDuration: '5s' }}>
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">Tutor de IA Integrado</p>
                <p className="text-[10px] text-slate-500">Filtros de conteúdo e fotos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section id="beneficios" className="py-24 bg-white/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">Super-Poderes Académicos</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Desenhado para simplificar e acelerar a tua aprendizagem cotidiana
            </h2>
            <p className="text-slate-600">
              Une todas as ferramentas de estudo num único ambiente moderno. Adeus cadernos perdidos, folhas de notas dispersas e exames sem preparação.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${b.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="font-display font-bold text-lg text-slate-900">{b.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{b.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1.5 rounded-full">Fluxo de Estudo</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Três passos simples para o sucesso escolar
            </h2>
            <p className="text-slate-600">
              O Learnix foi planeado para requerer apenas 5 minutos por dia. Registas o que aprendeste de manhã e a IA encarrega-se do resto à noite.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-[2px] bg-slate-200 -z-10"></div>

            {steps.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-4 px-4">
                <div className="w-14 h-14 rounded-full bg-white border-2 border-blue-600 text-blue-600 font-display font-bold text-xl flex items-center justify-center shadow-md shadow-blue-100 bg-white">
                  {s.num}
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots of software preview */}
      <section id="funcionalidades" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full">Digitalização Inteligente</span>
              <h2 className="font-display text-4xl font-bold tracking-tight text-slate-900">
                Transforma papel em conhecimento interativo
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Escrever à mão ajuda a fixar conteúdos, mas torna difícil a revisão aleatória. Com a digitalização por imagem simulada do Learnix, guardas o progresso do caderno organizadamente e utilizas as fotografias para alimentar os questionários automáticos da Inteligência Artificial.
              </p>

              <ul className="space-y-3.5 text-sm font-semibold text-slate-700">
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-emerald-500 mr-2.5 shrink-0" />
                  <span>Historial completo e categorizado por disciplinas</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-emerald-500 mr-2.5 shrink-0" />
                  <span>Extração simulada automática de títulos e fórmulas</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-emerald-500 mr-2.5 shrink-0" />
                  <span>Sugestões dinâmicas de revisão e auto-testes</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 relative">
              <div className="bg-white rounded-2xl shadow-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    <span className="text-xs font-bold text-slate-500">Módulo OCR Ativo</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Caderno Escolar</span>
                </div>

                {/* Simulated photo preview */}
                <div className="relative rounded-xl overflow-hidden aspect-video border bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600"
                    alt="Caderno Aberto"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-slate-950 to-transparent">
                    <p className="text-white text-xs font-bold">Resumos de Química Orgânica</p>
                    <p className="text-slate-300 text-[10px]">Cadeias de Hidrocarbonetos e Ácidos Carboxílicos</p>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center space-x-1.5 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    <span>Simulação OCR</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1.5">
                  <p className="text-xs font-bold text-emerald-800 flex items-center"><Lightbulb size={13} className="mr-1" /> IA Análise Sugerida:</p>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    Leitura computacional efetuada com sucesso. Detetados 14 termos fundamentais. Carregue em "Gerar Exercícios" para testar o equilíbrio químico e fórmulas associadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">Depoimentos</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              O que dizem os estudantes que usam o Learnix
            </h2>
            <p className="text-slate-600">
              Descobre como milhares de alunos estão a obter notas mais altas e a poupar horas de estudo passivo todas as semanas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <p className="text-slate-600 italic text-sm leading-relaxed mb-6">"{t.comment}"</p>
                <div className="flex items-center space-x-3.5">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full border border-slate-100 object-cover"
                  />
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-800">{t.name}</h4>
                    <p className="text-xs font-semibold text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="perguntas" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1.5 rounded-full">Perguntas Frequentes</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Tens dúvidas? Nós respondemos
            </h2>
          </div>

          <div className="space-y-4.5">
            {faqs.map((f, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden transition duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between font-bold text-slate-800 hover:text-blue-600 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-300"
                  >
                    <span className="pr-4">{f.q}</span>
                    <ChevronDown size={18} className={`transform transition text-slate-400 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-200/50 pt-3 bg-white">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA section Call To Action */}
      <section className="py-20 bg-gradient-to-tr from-blue-700 to-indigo-800 text-white relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-2xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Sparkles size={28} />
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Pronto para revolucionar as tuas notas escolares?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Começa hoje gratuitamente o teu trilho inteligente. Melhora as tuas respostas, economiza tempo e conquista aquela média ideal que sempre ambicionaste.
          </p>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center pt-4">
            <Link
              to="/login"
              className="bg-white hover:bg-slate-100 text-blue-800 font-extrabold px-8 py-3.5 rounded-xl text-sm sm:text-base transition-all shadow-lg hover:shadow-xl shrink-0"
            >
              Criar Conta Grátis
            </Link>
            <button
              onClick={handleQuickLogin}
              className="bg-transparent hover:bg-white/10 border border-white/30 text-white font-bold px-8 py-3.5 rounded-xl text-sm sm:text-base transition"
            >
              Entrar como Pedro
            </button>
          </div>
        </div>
      </section>

      {/* Footer modern layout */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <span className="font-display font-bold text-white text-lg">Learnix</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              "Learn smarter, grow faster."<br />
              Copright © 2026 Learnix Technologies. Todos os direitos reservados.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold tracking-wide uppercase">Produto</h4>
            <div className="flex flex-col space-y-2 text-xs">
              <span className="hover:text-white transition cursor-pointer">Funcionalidades</span>
              <span className="hover:text-white transition cursor-pointer">Orientação IA</span>
              <span className="hover:text-white transition cursor-pointer">Preçário fictício</span>
              <span className="hover:text-white transition cursor-pointer">Roadmap Escolar</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold tracking-wide uppercase">Recursos</h4>
            <div className="flex flex-col space-y-2 text-xs">
              <span className="hover:text-white transition cursor-pointer">Central de Ajuda</span>
              <span className="hover:text-white transition cursor-pointer">Estudos Científicos</span>
              <span className="hover:text-white transition cursor-pointer">Parcerias com Escolas</span>
              <span className="hover:text-white transition cursor-pointer">Blog de Produtividade</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold tracking-wide uppercase">Legal</h4>
            <div className="flex flex-col space-y-2 text-xs">
              <span className="hover:text-white transition cursor-pointer">Termos de Utilização</span>
              <span className="hover:text-white transition cursor-pointer">Política de Privacidade</span>
              <span className="hover:text-white transition cursor-pointer">Proteção de Menores</span>
              <span className="hover:text-white transition cursor-pointer">Definições de Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
