<?xml version="1.0" encoding="utf-8"?>
<!--++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-->
<!-- (C) COPYRIGHT BOC - Business Objectives Consulting 1995-2016                 -->
<!-- All Rights Reserved                                                          -->
<!-- Use, duplication or disclosure restricted by BOC                             -->
<!-- BOC Information Technologies Consulting GmbH, 2016                           -->
<!--++++++++++++++++++++++++++++DESCRIPTION+++++++++++++++++++++++++++++++++++++++-->
<!--																			  -->
<!-- The main step of BPMN DI export transformation which transforms adoxx3 XML   -->
<!--  XMLLight XML format to bpmn XML format				   		 		      -->
<!--																			  -->
<!--++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-->
<!--                                                                              -->
<!--                                                                              -->
<!-- Module:        BPMN DI Export                                                -->
<!--                                                                              -->
<!-- Attention:    When you change this file, then no support will be provided    -->
<!--               for this version of the BPMN DI Export !!!                     -->
<!--                                                                              -->
<!--++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-->
<xsl:stylesheet version="2.0" xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:functx="http://www.functx.com" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:boc="http://www.boc-group.com" xmlns:semantic="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:adonis="http://www.boc-group.com"  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xmi="http://www.omg.org/XMI" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xpath-default-namespace="http://www.omg.org/spec/BPMN/20100524/MODEL" >

	<xsl:template match="node()|@*">
		<xsl:copy>
			<xsl:apply-templates select="node()|@*"/>
		</xsl:copy>
	</xsl:template>

	<xsl:output version="1.0" encoding="utf-8"/>
	<xsl:output method="xml" indent="no"/>
	<xsl:template match="definitions/import"/>
	<xsl:template match="extensionElements"/>
	<xsl:template match="process/@id">

	</xsl:template>

	<xsl:template match="*">

		<xsl:element name="bpmn:{local-name()}">
			<xsl:choose>
				<xsl:when test="name()= 'definitions'">
					<xsl:namespace name="bpmndi" select="'http://www.omg.org/spec/BPMN/20100524/DI'"/>
					<xsl:namespace name="di" select="'http://www.omg.org/spec/DD/20100524/DI'"/>
				</xsl:when>
				<xsl:when test="name()= 'process'">
					<xsl:attribute name="id" select="'Process_1'"/>
				</xsl:when>
			</xsl:choose>

			<xsl:apply-templates select="node()|@*">

			</xsl:apply-templates>
		</xsl:element>
	</xsl:template>


</xsl:stylesheet>