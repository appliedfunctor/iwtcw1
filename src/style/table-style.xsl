<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
  <table>
    <thead>
        <tr>
            <th width="40%">Title</th>
            <th width="10%">Year</th>
            <th width="40%">Original title</th>
            <th width="10%">Original year</th>
            <th width="10%">Fraction</th>
        </tr>
    </thead>
    <tbody>
        <xsl:for-each select="//remake">
            <xsl:sort select="rtitle" />
            <tr>
                <td><xsl:value-of select="rtitle" /></td>
                <td><xsl:value-of select="ryear" /></td>
                <td><xsl:value-of select="stitle" /></td>
                <td><xsl:value-of select="syear" /></td>
                <td><xsl:value-of select="fraction" /></td>
            </tr>
        </xsl:for-each>
    </tbody>    
  </table>
</xsl:template>
</xsl:stylesheet>